import { getDb, getDefaultTenantId } from '../db.js';
import { requireAuth, signJwt, hashPassword, verifyPassword } from '../auth.js';

export async function handleAuthLogin(request, env) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return json({ error: 'Username and password required' }, 400);
  }

  const sql = getDb(env);
  const users = await sql`
    SELECT au.id, au.username, au.password_hash, au.role, au.name, au.tenant_id, t.slug as tenant_slug
    FROM admin_users au
    JOIN tenants t ON au.tenant_id = t.id
    WHERE au.username = ${username}
    LIMIT 1
  `;

  if (!users.length) {
    return json({ error: 'Tài khoản không tồn tại' }, 401);
  }

  const user = users[0];

  // Handle initial login with placeholder password
  if (user.password_hash === '$HASH_PLACEHOLDER') {
    const hash = await hashPassword(password);
    await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${user.id}`;
  } else {
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ error: 'Sai mật khẩu' }, 401);
  }

  const token = await signJwt({
    sub: user.id,
    username: user.username,
    role: user.role,
    tenant_id: user.tenant_id,
    tenant_slug: user.tenant_slug,
  }, env.JWT_SECRET);

  return json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
  });
}

export async function handleAuthMe(request, env) {
  const payload = await requireAuth(request, env);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const sql = getDb(env);
  const users = await sql`
    SELECT au.id, au.username, au.role, au.name, t.name as tenant_name, t.slug as tenant_slug
    FROM admin_users au
    JOIN tenants t ON au.tenant_id = t.id
    WHERE au.id = ${payload.sub}
    LIMIT 1
  `;
  if (!users.length) return json({ error: 'User not found' }, 404);
  return json({ user: users[0] });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
