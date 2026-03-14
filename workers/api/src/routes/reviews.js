import { getDb, getDefaultTenantId } from '../db.js';
import { requireAuth } from '../auth.js';

// POST /api/reviews — Guest: submit review
export async function handleCreateReview(request, env) {
  const body = await request.json();
  const { phone, name, service, rating, tags, review_text, suggestions, source_url } = body;

  const sql = getDb(env);
  const tenantId = await getDefaultTenantId(sql, env.DEFAULT_TENANT);

  const rows = await sql`
    INSERT INTO reviews (tenant_id, phone, name, service, rating, tags, review_text, suggestions, source_url)
    VALUES (${tenantId}, ${phone || null}, ${name || null}, ${service || null},
            ${rating ? parseInt(rating) : null}, ${tags || null}, ${review_text || null},
            ${suggestions || null}, ${source_url || null})
    RETURNING id, created_at
  `;

  return json({ status: 'success', review: rows[0] });
}

// GET /api/reviews — Admin: list reviews
export async function handleListReviews(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const rating = url.searchParams.get('rating');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const sql = getDb(env);

  let rows, countResult;
  if (rating) {
    rows = await sql`
      SELECT * FROM reviews WHERE tenant_id = ${payload.tenant_id} AND rating = ${parseInt(rating)}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`
      SELECT COUNT(*)::int as total FROM reviews WHERE tenant_id = ${payload.tenant_id} AND rating = ${parseInt(rating)}
    `;
  } else {
    rows = await sql`
      SELECT * FROM reviews WHERE tenant_id = ${payload.tenant_id}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countResult = await sql`
      SELECT COUNT(*)::int as total FROM reviews WHERE tenant_id = ${payload.tenant_id}
    `;
  }

  // Compute average rating
  const avgResult = await sql`
    SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*)::int as total_reviews
    FROM reviews WHERE tenant_id = ${payload.tenant_id} AND rating IS NOT NULL
  `;

  return json({
    reviews: rows,
    stats: avgResult[0],
    pagination: { page, limit, total: countResult[0].total }
  });
}

// PATCH /api/reviews/:id — Admin: respond to review
export async function handleUpdateReview(request, env, reviewId) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const { admin_response } = await request.json();
  const sql = getDb(env);

  await sql`
    UPDATE reviews SET admin_response = ${admin_response}
    WHERE id = ${reviewId} AND tenant_id = ${payload.tenant_id}
  `;

  const rows = await sql`SELECT * FROM reviews WHERE id = ${reviewId}`;
  if (!rows.length) return json({ error: 'Review not found' }, 404);

  return json({ review: rows[0] });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
