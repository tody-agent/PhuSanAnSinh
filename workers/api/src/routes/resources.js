import { getDb, getDefaultTenantId } from '../db.js';
import { requireAuth } from '../auth.js';

// GET /api/resources — Public: list active resources
export async function handleListResources(request, env) {
  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  const rows = await sql`
    SELECT id, title, type, file_url, download_count
    FROM resources WHERE tenant_id = ${tenantId} AND is_active = true
    ORDER BY created_at DESC
  `;

  return json({ resources: rows });
}

// POST /api/resources/download — Guest: track download (capture lead)
export async function handleResourceDownload(request, env) {
  const { resource_id, phone, name, email } = await request.json();
  if (!resource_id) return json({ error: 'resource_id required' }, 400);

  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  // Check resource exists
  const res = await sql`
    SELECT id, file_url FROM resources
    WHERE id = ${resource_id} AND tenant_id = ${tenantId} AND is_active = true
  `;
  if (!res.length) return json({ error: 'Resource not found' }, 404);

  // Track download
  await sql`
    INSERT INTO resource_downloads (resource_id, tenant_id, phone, name, email)
    VALUES (${resource_id}, ${tenantId}, ${phone || null}, ${name || null}, ${email || null})
  `;

  // Increment counter
  await sql`
    UPDATE resources SET download_count = download_count + 1 WHERE id = ${resource_id}
  `;

  return json({ status: 'success', file_url: res[0].file_url });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
