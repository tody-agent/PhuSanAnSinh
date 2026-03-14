/**
 * AnSinh API — Cloudflare Workers REST Gateway
 * Connected to Neon Serverless Postgres
 */
import { handleAuthLogin, handleAuthMe } from './routes/auth.js';
import { handleCreateBooking, handleListBookings, handleUpdateBooking } from './routes/bookings.js';
import { handleCreateReview, handleListReviews, handleUpdateReview } from './routes/reviews.js';
import { handleGetQueueConfig, handleGetQueueCurrent, handleQueueBook, handleQueueNext, handleListQueueTickets, handleSkipTicket, handleTransferTicket, handleAssignRoom, handleGetMyRoom, handleUpsertRoom, handleDeleteRoom, handleListQueueStaff, handleQueueCheckin } from './routes/queue.js';
import { handleListLeads, handleUpdateLead } from './routes/leads.js';
import { handleDashboard } from './routes/dashboard.js';
import { handleListResources, handleResourceDownload } from './routes/resources.js';
import { ADMIN_HTML } from './admin-html.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Extract :id param from URL path.
 * e.g. matchRoute('/api/bookings/abc-123', '/api/bookings/') => 'abc-123'
 */
function extractId(path, prefix) {
  if (!path.startsWith(prefix)) return null;
  const id = path.slice(prefix.length).replace(/\/$/, '');
  return id || null;
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      let response;

      // ── Admin Panel (static HTML) ──
      if (path === '/admin' || path === '/admin/' || path.startsWith('/admin')) {
        return new Response(ADMIN_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // ── Auth ──
      if (path === '/api/auth/login' && method === 'POST') {
        response = await handleAuthLogin(request, env);
      }
      else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleAuthMe(request, env);
      }

      // ── Bookings ──
      else if (path === '/api/bookings' && method === 'POST') {
        response = await handleCreateBooking(request, env);
      }
      else if (path === '/api/bookings' && method === 'GET') {
        response = await handleListBookings(request, env);
      }
      else if (method === 'PATCH' && extractId(path, '/api/bookings/')) {
        response = await handleUpdateBooking(request, env, extractId(path, '/api/bookings/'));
      }

      // ── Reviews ──
      else if (path === '/api/reviews' && method === 'POST') {
        response = await handleCreateReview(request, env);
      }
      else if (path === '/api/reviews' && method === 'GET') {
        response = await handleListReviews(request, env);
      }
      else if (method === 'PATCH' && extractId(path, '/api/reviews/')) {
        response = await handleUpdateReview(request, env, extractId(path, '/api/reviews/'));
      }

      // ── Queue ──
      else if (path === '/api/queue/config' && method === 'GET') {
        response = await handleGetQueueConfig(request, env);
      }
      else if (path === '/api/queue/current' && method === 'GET') {
        response = await handleGetQueueCurrent(request, env);
      }
      else if (path === '/api/queue/book' && method === 'POST') {
        response = await handleQueueBook(request, env);
      }
      else if (path === '/api/queue/next' && method === 'POST') {
        response = await handleQueueNext(request, env);
      }
      else if (path === '/api/queue/tickets' && method === 'GET') {
        response = await handleListQueueTickets(request, env);
      }
      else if (path === '/api/queue/skip' && method === 'POST') {
        response = await handleSkipTicket(request, env);
      }
      else if (path === '/api/queue/checkin' && method === 'POST') {
        response = await handleQueueCheckin(request, env);
      }
      else if (path === '/api/queue/transfer' && method === 'POST') {
        response = await handleTransferTicket(request, env);
      }
      else if (path === '/api/queue/assign-room' && method === 'POST') {
        response = await handleAssignRoom(request, env);
      }
      else if (path === '/api/queue/my-room' && method === 'GET') {
        response = await handleGetMyRoom(request, env);
      }
      else if (path === '/api/queue/rooms' && method === 'POST') {
        response = await handleUpsertRoom(request, env);
      }
      else if (method === 'DELETE' && extractId(path, '/api/queue/rooms/')) {
        response = await handleDeleteRoom(request, env, extractId(path, '/api/queue/rooms/'));
      }
      else if (path === '/api/queue/staff' && method === 'GET') {
        response = await handleListQueueStaff(request, env);
      }

      // ── Leads ──
      else if (path === '/api/leads' && method === 'GET') {
        response = await handleListLeads(request, env);
      }
      else if (method === 'PATCH' && extractId(path, '/api/leads/')) {
        response = await handleUpdateLead(request, env, extractId(path, '/api/leads/'));
      }

      // ── Dashboard ──
      else if (path === '/api/dashboard' && method === 'GET') {
        response = await handleDashboard(request, env);
      }

      // ── Resources ──
      else if (path === '/api/resources' && method === 'GET') {
        response = await handleListResources(request, env);
      }
      else if (path === '/api/resources/download' && method === 'POST') {
        response = await handleResourceDownload(request, env);
      }

      // ── 404 ──
      else {
        response = json({ error: 'Not found', path }, 404);
      }

      return withCors(response);

    } catch (err) {
      console.error('API Error:', err);
      return withCors(json({ error: err.message || 'Internal Server Error' }, 500));
    }
  },
};
