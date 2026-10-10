import { Client } from 'pg';

async function check() {
  const client = new Client('postgresql://tu:123@localhost:5432/cognito_test');
  try {
    await client.connect();
    const res = await client.query("SELECT current_database(), COUNT(*)::int as tables FROM information_schema.tables WHERE table_schema='public'");
    console.log('Result:', res.rows[0]);
  } catch (err: any) {
    console.error('Error connecting to cognito_test:', err.message);
  } finally {
    await client.end();
  }
}

check();
