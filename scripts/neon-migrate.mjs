import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const DATABASE_URL = 'postgresql://neondb_owner:npg_G5TQjlAo1gyV@ep-sparkling-silence-a1ke5nvj.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function migrate() {
  const schema = readFileSync('/tmp/neon-saas-schema.sql', 'utf8');
  
  // Split by semicolons, filter empty/comment-only statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      const noComments = s.replace(/--.*$/gm, '').trim();
      return noComments.length > 0;
    });

  console.log(`Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\n/g, ' ').substring(0, 80);
    try {
      await sql.query(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
    } catch (err) {
      console.error(`❌ [${i + 1}/${statements.length}] ${preview}...`);
      console.error(`   Error: ${err.message}`);
    }
  }

  // Verify using tagged template
  console.log('\n--- Verification ---');
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('Tables:', tables.map(t => t.table_name).join(', '));
  
  const tenant = await sql`SELECT slug, name, industry FROM tenants`;
  console.log('Tenants:', JSON.stringify(tenant));
  
  const services = await sql`SELECT name, code FROM services ORDER BY sort_order`;
  console.log('Services:', JSON.stringify(services));

  const rooms = await sql`SELECT room_id, doctor_name FROM queue_rooms`;
  console.log('Queue Rooms:', JSON.stringify(rooms));
}

migrate().catch(console.error);
