import { neon } from '@neondatabase/serverless';

/**
 * Create a Neon SQL client from the environment variable.
 * Usage: const sql = getDb(env); const result = await sql`SELECT * FROM tenants`;
 */
export function getDb(env) {
  return neon(env.DATABASE_URL);
}

/**
 * Get the default tenant ID for the platform.
 */
export async function getDefaultTenantId(sql, tenantSlug = 'an-sinh') {
  const rows = await sql`SELECT id FROM tenants WHERE slug = ${tenantSlug} LIMIT 1`;
  if (!rows.length) throw new Error(`Tenant "${tenantSlug}" not found`);
  return rows[0].id;
}
