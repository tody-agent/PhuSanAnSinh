import { getDb, getDefaultTenantId } from '../db.js';
import { requireAuth } from '../auth.js';

// POST /api/bookings — Guest: create booking
export async function handleCreateBooking(request, env) {
  const body = await request.json();
  const { phone, name, service, date, time_slot, note, form_type, source_url } = body;

  if (!phone || !/^0\d{8,10}$/.test(phone.replace(/\s/g, ''))) {
    return json({ error: 'Số điện thoại không hợp lệ' }, 400);
  }

  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  const rows = await sql`
    INSERT INTO bookings (tenant_id, phone, name, service, date, time_slot, note, form_type, source_url)
    VALUES (${tenantId}, ${phone.trim()}, ${name || null}, ${service || null}, 
            ${date || null}, ${time_slot || null}, ${note || null}, 
            ${form_type || 'booking'}, ${source_url || null})
    RETURNING id, status, created_at
  `;

  return json({ status: 'success', booking: rows[0] }, 201);
}

// GET /api/bookings — Admin: list bookings
export async function handleListBookings(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const sql = getDb(env);

  let rows, countResult;
  if (status) {
    rows = await sql`
      SELECT * FROM bookings WHERE tenant_id = ${payload.tenant_id} AND status = ${status}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`
      SELECT COUNT(*)::int as total FROM bookings WHERE tenant_id = ${payload.tenant_id} AND status = ${status}
    `;
  } else {
    rows = await sql`
      SELECT * FROM bookings WHERE tenant_id = ${payload.tenant_id}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`
      SELECT COUNT(*)::int as total FROM bookings WHERE tenant_id = ${payload.tenant_id}
    `;
  }

  return json({
    bookings: rows,
    pagination: { page, limit, total: countResult[0].total }
  });
}

// PATCH /api/bookings/:id — Admin: update booking status
export async function handleUpdateBooking(request, env, bookingId) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const body = await request.json();
  const { status, note } = body;

  const sql = getDb(env);

  const updates = [];
  if (status) {
    await sql`
      UPDATE bookings SET status = ${status}, updated_at = NOW()
      WHERE id = ${bookingId} AND tenant_id = ${payload.tenant_id}
    `;
  }
  if (note !== undefined) {
    await sql`
      UPDATE bookings SET note = ${note}, updated_at = NOW()
      WHERE id = ${bookingId} AND tenant_id = ${payload.tenant_id}
    `;
  }

  const rows = await sql`
    SELECT * FROM bookings WHERE id = ${bookingId} AND tenant_id = ${payload.tenant_id}
  `;
  if (!rows.length) return json({ error: 'Booking not found' }, 404);

  return json({ booking: rows[0] });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
