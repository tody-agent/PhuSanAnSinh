import { getDb } from '../db.js';
import { requireAuth } from '../auth.js';

// GET /api/leads — Admin: unified leads view (bookings + resource downloads)
export async function handleListLeads(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const sql = getDb(env);

  // Unified leads: bookings as leads
  let rows;
  if (status) {
    rows = await sql`
      SELECT id, phone, name, service, status, form_type as source, created_at, updated_at
      FROM bookings WHERE tenant_id = ${payload.tenant_id} AND status = ${status}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    rows = await sql`
      SELECT id, phone, name, service, status, form_type as source, created_at, updated_at
      FROM bookings WHERE tenant_id = ${payload.tenant_id}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const countResult = await sql`
    SELECT COUNT(*)::int as total FROM bookings WHERE tenant_id = ${payload.tenant_id}
  `;

  // Pipeline stats
  const pipeline = await sql`
    SELECT status, COUNT(*)::int as count
    FROM bookings WHERE tenant_id = ${payload.tenant_id}
    GROUP BY status
  `;

  return json({
    leads: rows,
    pipeline: Object.fromEntries(pipeline.map(p => [p.status, p.count])),
    pagination: { page, limit, total: countResult[0].total }
  });
}

// PATCH /api/leads/:id — Admin: update lead status
export async function handleUpdateLead(request, env, leadId) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { status, note } = await request.json();
  const sql = getDb(env);

  if (status) {
    await sql`
      UPDATE bookings SET status = ${status}, updated_at = NOW()
      WHERE id = ${leadId} AND tenant_id = ${payload.tenant_id}
    `;
  }
  if (note !== undefined) {
    await sql`
      UPDATE bookings SET note = ${note}, updated_at = NOW()
      WHERE id = ${leadId} AND tenant_id = ${payload.tenant_id}
    `;
  }

  const rows = await sql`SELECT * FROM bookings WHERE id = ${leadId}`;
  if (!rows.length) return json({ error: 'Lead not found' }, 404);

  return json({ lead: rows[0] });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
