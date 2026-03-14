import { getDb } from '../db.js';
import { requireAuth } from '../auth.js';

// GET /api/dashboard — Admin: dashboard metrics
export async function handleDashboard(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const sql = getDb(env);
  const tid = payload.tenant_id;

  // Today's bookings
  const bookingsToday = await sql`
    SELECT COUNT(*)::int as count FROM bookings
    WHERE tenant_id = ${tid} AND created_at >= CURRENT_DATE
  `;

  // Total bookings
  const bookingsTotal = await sql`
    SELECT COUNT(*)::int as count FROM bookings WHERE tenant_id = ${tid}
  `;

  // Booking status breakdown
  const bookingsByStatus = await sql`
    SELECT status, COUNT(*)::int as count FROM bookings
    WHERE tenant_id = ${tid} GROUP BY status
  `;

  // Avg rating
  const ratingStats = await sql`
    SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating,
           COUNT(*)::int as total_reviews
    FROM reviews WHERE tenant_id = ${tid} AND rating IS NOT NULL
  `;

  // Reviews today
  const reviewsToday = await sql`
    SELECT COUNT(*)::int as count FROM reviews
    WHERE tenant_id = ${tid} AND created_at >= CURRENT_DATE
  `;

  // Queue today
  const queueToday = await sql`
    SELECT COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE status = 'waiting')::int as waiting,
           COUNT(*) FILTER (WHERE status = 'called')::int as called
    FROM queue_tickets
    WHERE tenant_id = ${tid} AND created_at >= CURRENT_DATE
  `;

  // Resource downloads
  const downloads = await sql`
    SELECT COUNT(*)::int as count FROM resource_downloads
    WHERE tenant_id = ${tid}
  `;

  // Recent bookings (last 5)
  const recentBookings = await sql`
    SELECT id, phone, name, service, status, created_at
    FROM bookings WHERE tenant_id = ${tid}
    ORDER BY created_at DESC LIMIT 5
  `;

  return json({
    bookings: {
      today: bookingsToday[0].count,
      total: bookingsTotal[0].count,
      byStatus: Object.fromEntries(bookingsByStatus.map(b => [b.status, b.count]))
    },
    reviews: {
      today: reviewsToday[0].count,
      avgRating: ratingStats[0].avg_rating,
      totalReviews: ratingStats[0].total_reviews,
    },
    queue: queueToday[0],
    downloads: downloads[0].count,
    recentBookings
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
