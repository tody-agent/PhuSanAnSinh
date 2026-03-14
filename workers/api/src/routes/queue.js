import { getDb, getDefaultTenantId } from '../db.js';
import { requireAuth } from '../auth.js';

// ═══════════════════════════════════════
// PUBLIC ENDPOINTS
// ═══════════════════════════════════════

// GET /api/queue/config — Public: get active rooms with services + type
export async function handleGetQueueConfig(request, env) {
  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  const rooms = await sql`
    SELECT qr.id, qr.room_id, qr.doctor_name, qr.services, qr.status,
           qr.type, qr.zone, qr.sort_order
    FROM queue_rooms qr
    WHERE qr.tenant_id = ${tenantId} AND qr.status = 'active'
    ORDER BY qr.sort_order ASC, qr.room_id ASC
  `;

  // Get room-service mappings
  const roomIds = rooms.map(r => r.id);
  let roomServiceMap = {};
  if (roomIds.length) {
    const rs = await sql`
      SELECT rs.room_id, s.id as service_id, s.name, s.code
      FROM room_services rs
      JOIN services s ON s.id = rs.service_id
      WHERE rs.room_id = ANY(${roomIds})
    `;
    for (const row of rs) {
      if (!roomServiceMap[row.room_id]) roomServiceMap[row.room_id] = [];
      roomServiceMap[row.room_id].push({ id: row.service_id, name: row.name, code: row.code });
    }
  }

  return json({
    status: 'success',
    data: rooms.map(r => ({
      id: r.id,
      roomId: r.room_id,
      doctorName: r.doctor_name,
      type: r.type || 'room',
      zone: r.zone || null,
      services: roomServiceMap[r.id] || [],
      // Fallback: legacy comma-separated
      servicesLegacy: r.services ? r.services.split(',').map(s => s.trim()) : []
    }))
  });
}

// GET /api/queue/current — Public: get current queue status for TV display
export async function handleGetQueueCurrent(request, env) {
  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  const url = new URL(request.url);
  const zone = url.searchParams.get('zone');

  let current;
  if (zone) {
    current = await sql`
      SELECT qc.room_id, qc.current_ticket, qc.customer_name, qc.called_at,
             qr.type, qr.zone, qr.doctor_name, qr.sort_order
      FROM queue_current qc
      JOIN queue_rooms qr ON qr.tenant_id = qc.tenant_id AND qr.room_id = qc.room_id
      WHERE qc.tenant_id = ${tenantId} AND qr.zone = ${zone}
      ORDER BY qr.sort_order ASC
    `;
  } else {
    current = await sql`
      SELECT qc.room_id, qc.current_ticket, qc.customer_name, qc.called_at,
             qr.type, qr.zone, qr.doctor_name, qr.sort_order
      FROM queue_current qc
      JOIN queue_rooms qr ON qr.tenant_id = qc.tenant_id AND qr.room_id = qc.room_id
      WHERE qc.tenant_id = ${tenantId}
      ORDER BY qr.sort_order ASC
    `;
  }

  const data = {};
  for (const row of current) {
    data[row.room_id] = {
      queueNumber: row.current_ticket || '',
      customerName: row.customer_name || '',
      timeCalled: row.called_at || '',
      type: row.type || 'room',
      zone: row.zone || '',
      doctorName: row.doctor_name || ''
    };
  }

  return json({ status: 'success', data });
}

// POST /api/queue/book — Guest: get a queue ticket
export async function handleQueueBook(request, env) {
  const body = await request.json();
  const { name, phone, service, dob, gender, area, note, source_url, booking_id } = body;

  if (!name?.trim()) return json({ status: 'error', message: 'Họ và tên là bắt buộc.' }, 400);
  if (!phone?.trim() || !/^0\d{8,10}$/.test(phone.replace(/\s/g, ''))) {
    return json({ status: 'error', message: 'Số điện thoại không đúng (0xxx).' }, 400);
  }

  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  // Look up service code
  const svcRows = await sql`
    SELECT code FROM services WHERE tenant_id = ${tenantId} AND name = ${service || ''}
    LIMIT 1
  `;
  const serviceCode = svcRows.length ? svcRows[0].code : 'CH';

  // Check if this is a pre-booked patient
  let priority = 0;
  let validBookingId = null;
  if (booking_id) {
    const bookingCheck = await sql`
      SELECT id FROM bookings WHERE id = ${booking_id} AND tenant_id = ${tenantId} LIMIT 1
    `;
    if (bookingCheck.length) {
      priority = 1;
      validBookingId = booking_id;
    }
  } else {
    // Auto-detect: check if phone has a booking for today
    const todayBooking = await sql`
      SELECT id FROM bookings
      WHERE tenant_id = ${tenantId} AND phone = ${phone.trim()}
        AND date = CURRENT_DATE AND status IN ('pending', 'confirmed')
      ORDER BY created_at DESC LIMIT 1
    `;
    if (todayBooking.length) {
      priority = 1;
      validBookingId = todayBooking[0].id;
    }
  }

  // Generate ticket number: YYMMDD-CODE-NNN
  const now = new Date();
  const tz = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit', month: '2-digit', day: '2-digit'
  });
  const parts = tz.formatToParts(now);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  const datePrefix = `${y}${m}${d}`;

  // Find max number for today
  const maxResult = await sql`
    SELECT ticket_number FROM queue_tickets
    WHERE tenant_id = ${tenantId} AND ticket_number LIKE ${datePrefix + '-%'}
    ORDER BY created_at DESC LIMIT 1
  `;

  let nextNum = 1;
  if (maxResult.length) {
    const lastParts = maxResult[0].ticket_number.split('-');
    if (lastParts.length === 3) {
      nextNum = parseInt(lastParts[2], 10) + 1;
    }
  }

  const ticketNumber = `${datePrefix}-${serviceCode}-${String(nextNum).padStart(3, '0')}`;

  await sql`
    INSERT INTO queue_tickets (tenant_id, ticket_number, name, dob, gender, phone, area, service, note, source_url, priority, booking_id, service_code)
    VALUES (${tenantId}, ${ticketNumber}, ${name.trim()}, ${dob || null}, ${gender || 'Nữ'},
            ${phone.trim()}, ${area || null}, ${service || null}, ${note || null}, ${source_url || null},
            ${priority}, ${validBookingId}, ${serviceCode})
  `;

  return json({
    status: 'success',
    queueNumber: ticketNumber,
    name: name.trim(),
    service: service || '',
    priority,
    time: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  });
}

// POST /api/queue/checkin — Admin/Receptionist: check-in a pre-booked patient by phone
export async function handleQueueCheckin(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { phone } = await request.json();
  if (!phone?.trim()) return json({ status: 'error', message: 'Số điện thoại là bắt buộc' }, 400);

  const sql = getDb(env);
  
  // Find today's booking
  const todayBooking = await sql`
    SELECT id, name, service, dob, gender, note
    FROM bookings
    WHERE tenant_id = ${payload.tenant_id} AND phone = ${phone.trim()}
      AND date = CURRENT_DATE AND (status = 'pending' OR status = 'confirmed')
    ORDER BY created_at DESC LIMIT 1
  `;

  if (!todayBooking.length) {
    return json({ status: 'error', message: 'Không tìm thấy lịch hẹn cho số điện thoại này hôm nay.' }, 404);
  }

  const booking = todayBooking[0];

  // Update booking to confirmed if it's pending (or just mark as checked in)
  await sql`
    UPDATE bookings SET status = 'confirmed' 
    WHERE id = ${booking.id} AND status = 'pending'
  `;

  // Check if ticket already generated for this booking today
  const existingTicket = await sql`
    SELECT ticket_number, service_code, name FROM queue_tickets
    WHERE tenant_id = ${payload.tenant_id} AND booking_id = ${booking.id}
    LIMIT 1
  `;

  if (existingTicket.length) {
    return json({
      status: 'success',
      queueNumber: existingTicket[0].ticket_number,
      name: existingTicket[0].name,
      service: booking.service || '',
      message: 'Khách hàng đã check-in trước đó'
    });
  }

  // Look up service code
  const svcRows = await sql`
    SELECT code FROM services WHERE tenant_id = ${payload.tenant_id} AND name = ${booking.service || ''}
    LIMIT 1
  `;
  const serviceCode = svcRows.length ? svcRows[0].code : 'CH';

  // Generate ticket number: YYMMDD-CODE-NNN
  const now = new Date();
  const tz = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit', month: '2-digit', day: '2-digit'
  });
  const parts = tz.formatToParts(now);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  const datePrefix = `${y}${m}${d}`;

  // Find max number for today
  const maxResult = await sql`
    SELECT ticket_number FROM queue_tickets
    WHERE tenant_id = ${payload.tenant_id} AND ticket_number LIKE ${datePrefix + '-%'}
    ORDER BY created_at DESC LIMIT 1
  `;

  let nextNum = 1;
  if (maxResult.length) {
    const lastParts = maxResult[0].ticket_number.split('-');
    if (lastParts.length === 3) {
      nextNum = parseInt(lastParts[2], 10) + 1;
    }
  }

  const ticketNumber = `${datePrefix}-${serviceCode}-${String(nextNum).padStart(3, '0')}`;

  await sql`
    INSERT INTO queue_tickets (tenant_id, ticket_number, name, dob, gender, phone, service, note, priority, booking_id, service_code)
    VALUES (${payload.tenant_id}, ${ticketNumber}, ${booking.name}, ${booking.dob || null}, ${booking.gender || 'Nữ'},
            ${phone.trim()}, ${booking.service || null}, ${booking.note || null}, 1, ${booking.id}, ${serviceCode})
  `;

  return json({
    status: 'success',
    queueNumber: ticketNumber,
    name: booking.name,
    service: booking.service || ''
  });
}

// ═══════════════════════════════════════
// ADMIN ENDPOINTS (require auth)
// ═══════════════════════════════════════

// POST /api/queue/next — Admin: call next patient (auto or manual mode)
export async function handleQueueNext(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const body = await request.json();
  const { roomId, nextQueueNumber, mode } = body;
  // mode: 'auto' | 'manual' (default: 'auto')

  if (!roomId) return json({ status: 'error', message: 'roomId là bắt buộc' }, 400);

  const sql = getDb(env);
  const now = new Date();

  let ticketNumber = nextQueueNumber;
  let customerName = '';

  if (mode === 'manual' && nextQueueNumber) {
    // Manual mode: use the specified ticket
    const tickets = await sql`
      SELECT name FROM queue_tickets
      WHERE tenant_id = ${payload.tenant_id} AND ticket_number = ${nextQueueNumber}
      LIMIT 1
    `;
    customerName = tickets.length ? tickets[0].name : 'Khách hàng';
  } else {
    // Auto mode: pick next ticket matching room's services, priority first
    // Get room's service codes
    const roomRow = await sql`
      SELECT id FROM queue_rooms
      WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
      LIMIT 1
    `;

    let serviceCodes = [];
    if (roomRow.length) {
      const svcRows = await sql`
        SELECT s.code FROM room_services rs
        JOIN services s ON s.id = rs.service_id
        WHERE rs.room_id = ${roomRow[0].id}
      `;
      serviceCodes = svcRows.map(r => r.code);
    }

    // Find next waiting ticket matching these services
    let nextTicket;
    if (serviceCodes.length) {
      nextTicket = await sql`
        SELECT ticket_number, name FROM queue_tickets
        WHERE tenant_id = ${payload.tenant_id}
          AND status = 'waiting'
          AND service_code = ANY(${serviceCodes})
          AND created_at >= CURRENT_DATE
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
      `;
    } else {
      // No service filter — pick any waiting ticket
      nextTicket = await sql`
        SELECT ticket_number, name FROM queue_tickets
        WHERE tenant_id = ${payload.tenant_id}
          AND status = 'waiting'
          AND created_at >= CURRENT_DATE
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
      `;
    }

    if (!nextTicket.length) {
      return json({ status: 'error', message: 'Không còn bệnh nhân đang chờ' }, 404);
    }

    ticketNumber = nextTicket[0].ticket_number;
    customerName = nextTicket[0].name;
  }

  if (ticketNumber) {
    // Mark ticket as called
    await sql`
      UPDATE queue_tickets SET status = 'called', called_at = ${now.toISOString()}, assigned_room = ${roomId}
      WHERE tenant_id = ${payload.tenant_id} AND ticket_number = ${ticketNumber}
    `;
  }

  // Upsert queue_current
  const existing = await sql`
    SELECT id FROM queue_current
    WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
  `;

  if (existing.length) {
    await sql`
      UPDATE queue_current SET current_ticket = ${ticketNumber || null},
        customer_name = ${customerName}, called_at = ${now.toISOString()}
      WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
    `;
  } else {
    await sql`
      INSERT INTO queue_current (tenant_id, room_id, current_ticket, customer_name, called_at)
      VALUES (${payload.tenant_id}, ${roomId}, ${ticketNumber || null}, ${customerName}, ${now.toISOString()})
    `;
  }

  return json({
    status: 'success',
    roomId,
    calledNumber: ticketNumber || '',
    customerName
  });
}

// GET /api/queue/tickets — Admin: list queue tickets for today
export async function handleListQueueTickets(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const roomId = url.searchParams.get('room_id');

  const sql = getDb(env);

  // If room_id provided, filter by room's services
  let serviceCodes = null;
  if (roomId) {
    const roomRow = await sql`
      SELECT id FROM queue_rooms
      WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
      LIMIT 1
    `;
    if (roomRow.length) {
      const svcRows = await sql`
        SELECT s.code FROM room_services rs
        JOIN services s ON s.id = rs.service_id
        WHERE rs.room_id = ${roomRow[0].id}
      `;
      serviceCodes = svcRows.map(r => r.code);
    }
  }

  let rows;
  if (status && serviceCodes?.length) {
    rows = await sql`
      SELECT * FROM queue_tickets
      WHERE tenant_id = ${payload.tenant_id} AND status = ${status}
        AND service_code = ANY(${serviceCodes})
        AND created_at >= CURRENT_DATE
      ORDER BY priority DESC, created_at ASC
    `;
  } else if (status) {
    rows = await sql`
      SELECT * FROM queue_tickets
      WHERE tenant_id = ${payload.tenant_id} AND status = ${status}
        AND created_at >= CURRENT_DATE
      ORDER BY priority DESC, created_at ASC
    `;
  } else if (serviceCodes?.length) {
    rows = await sql`
      SELECT * FROM queue_tickets
      WHERE tenant_id = ${payload.tenant_id}
        AND service_code = ANY(${serviceCodes})
        AND created_at >= CURRENT_DATE
      ORDER BY priority DESC, created_at ASC
    `;
  } else {
    rows = await sql`
      SELECT * FROM queue_tickets
      WHERE tenant_id = ${payload.tenant_id}
        AND created_at >= CURRENT_DATE
      ORDER BY priority DESC, created_at ASC
    `;
  }

  return json({ tickets: rows });
}

// POST /api/queue/skip — Admin: skip a ticket
export async function handleSkipTicket(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { ticketNumber } = await request.json();
  if (!ticketNumber) return json({ status: 'error', message: 'ticketNumber là bắt buộc' }, 400);

  const sql = getDb(env);
  await sql`
    UPDATE queue_tickets SET status = 'skipped'
    WHERE tenant_id = ${payload.tenant_id} AND ticket_number = ${ticketNumber}
  `;

  return json({ status: 'success', ticketNumber });
}

// POST /api/queue/transfer — Admin: transfer ticket to another room
export async function handleTransferTicket(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { ticketNumber, targetRoomId } = await request.json();
  if (!ticketNumber || !targetRoomId) {
    return json({ status: 'error', message: 'ticketNumber và targetRoomId là bắt buộc' }, 400);
  }

  const sql = getDb(env);

  // Reset ticket to waiting with new assigned room
  await sql`
    UPDATE queue_tickets SET status = 'waiting', assigned_room = ${targetRoomId}
    WHERE tenant_id = ${payload.tenant_id} AND ticket_number = ${ticketNumber}
  `;

  return json({ status: 'success', ticketNumber, targetRoomId });
}

// POST /api/queue/assign-room — Admin: assign staff to room
export async function handleAssignRoom(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { userId, roomId } = await request.json();
  if (!userId || !roomId) {
    return json({ status: 'error', message: 'userId và roomId là bắt buộc' }, 400);
  }

  const sql = getDb(env);

  // Get room UUID
  const roomRow = await sql`
    SELECT id FROM queue_rooms
    WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
    LIMIT 1
  `;
  if (!roomRow.length) return json({ status: 'error', message: 'Phòng không tồn tại' }, 404);

  // Upsert staff_rooms for today
  await sql`
    INSERT INTO staff_rooms (tenant_id, user_id, room_id, assigned_date, is_active)
    VALUES (${payload.tenant_id}, ${userId}, ${roomRow[0].id}, CURRENT_DATE, true)
    ON CONFLICT (user_id, room_id, assigned_date) DO UPDATE SET is_active = true
  `;

  return json({ status: 'success', userId, roomId });
}

// GET /api/queue/my-room — Staff: get my assigned rooms for today
export async function handleGetMyRoom(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const sql = getDb(env);

  const rooms = await sql`
    SELECT qr.room_id, qr.doctor_name, qr.type, qr.zone, qr.services, qr.sort_order
    FROM staff_rooms sr
    JOIN queue_rooms qr ON qr.id = sr.room_id
    WHERE sr.user_id = ${payload.user_id}
      AND sr.assigned_date = CURRENT_DATE
      AND sr.is_active = true
    ORDER BY qr.sort_order ASC
  `;

  return json({ status: 'success', rooms });
}

// POST /api/queue/rooms — Admin: create/update room
export async function handleUpsertRoom(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { roomId, doctorName, type, zone, status: roomStatus, serviceIds, sortOrder } = await request.json();
  if (!roomId) return json({ status: 'error', message: 'roomId là bắt buộc' }, 400);

  const sql = getDb(env);

  // Upsert room
  const existing = await sql`
    SELECT id FROM queue_rooms
    WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
  `;

  let roomUuid;
  if (existing.length) {
    roomUuid = existing[0].id;
    await sql`
      UPDATE queue_rooms SET
        doctor_name = ${doctorName || null},
        type = ${type || 'room'},
        zone = ${zone || null},
        status = ${roomStatus || 'active'},
        sort_order = ${sortOrder || 0}
      WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
    `;
  } else {
    const inserted = await sql`
      INSERT INTO queue_rooms (tenant_id, room_id, doctor_name, type, zone, status, sort_order)
      VALUES (${payload.tenant_id}, ${roomId}, ${doctorName || null}, ${type || 'room'}, ${zone || null}, ${roomStatus || 'active'}, ${sortOrder || 0})
      RETURNING id
    `;
    roomUuid = inserted[0].id;
  }

  // Update room-service mappings
  if (serviceIds && Array.isArray(serviceIds)) {
    await sql`DELETE FROM room_services WHERE room_id = ${roomUuid}`;
    for (const svcId of serviceIds) {
      await sql`
        INSERT INTO room_services (room_id, service_id) VALUES (${roomUuid}, ${svcId})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return json({ status: 'success', roomId });
}

// DELETE /api/queue/rooms/:roomId — Admin: delete room
export async function handleDeleteRoom(request, env, roomId) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const sql = getDb(env);
  await sql`
    DELETE FROM queue_rooms
    WHERE tenant_id = ${payload.tenant_id} AND room_id = ${roomId}
  `;

  return json({ status: 'success' });
}

// GET /api/queue/staff — Admin: list staff for room assignment
export async function handleListQueueStaff(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const sql = getDb(env);
  const staff = await sql`
    SELECT au.id, au.name, au.username, au.role,
           r.code as role_code, r.name as role_name
    FROM admin_users au
    LEFT JOIN roles r ON r.id = au.role_id
    WHERE au.tenant_id = ${payload.tenant_id}
    ORDER BY au.name ASC
  `;

  // Get today's assignments
  const assignments = await sql`
    SELECT sr.user_id, qr.room_id
    FROM staff_rooms sr
    JOIN queue_rooms qr ON qr.id = sr.room_id
    WHERE sr.tenant_id = ${payload.tenant_id}
      AND sr.assigned_date = CURRENT_DATE
      AND sr.is_active = true
  `;

  const assignMap = {};
  for (const a of assignments) {
    if (!assignMap[a.user_id]) assignMap[a.user_id] = [];
    assignMap[a.user_id].push(a.room_id);
  }

  return json({
    status: 'success',
    staff: staff.map(s => ({
      id: s.id,
      name: s.name,
      username: s.username,
      role: s.role,
      roleCode: s.role_code,
      roleName: s.role_name,
      assignedRooms: assignMap[s.id] || []
    }))
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
