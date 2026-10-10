import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupTestDb() {
  console.log('=== SETTING UP COGNITO_TEST DATABASE ===');
  
  const devDbUrl = process.env.DATABASE_URL || 'postgresql://tu:123@localhost:5432/cognito?schema=public';
  // Parse connection to postgres default db to check/create cognito_test
  const match = devDbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const [_, user, password, host, port] = match;
  const adminClient = new Client({
    user,
    password,
    host,
    port: parseInt(port, 10),
    database: 'postgres', // connect to default database to manage databases
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL root server');

    const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'cognito_test'");
    if (res.rows.length === 0) {
      console.log("Database 'cognito_test' does not exist. Creating it now...");
      await adminClient.query('CREATE DATABASE cognito_test');
      console.log("✅ Created database 'cognito_test'");
    } else {
      console.log("Database 'cognito_test' already exists.");
    }
  } catch (err: any) {
    console.error('Error checking/creating test db:', err.message);
  } finally {
    await adminClient.end();
  }

  // Construct DATABASE_URL_TEST
  const testDbUrl = `postgresql://${user}:${password}@${host}:${port}/cognito_test?schema=public`;
  console.log(`DATABASE_URL_TEST: ${testDbUrl}`);

  // Run migrations on cognito_test
  console.log('\n=== RUNNING MIGRATIONS ON COGNITO_TEST ===');
  try {
    execSync('npx node-pg-migrate up --no-check-order', {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
      },
      stdio: 'inherit',
    });
    console.log('✅ Migrations applied successfully to cognito_test');
  } catch (migErr: any) {
    console.error('Migration failed on cognito_test:', migErr.message);
    process.exit(1);
  }
}

setupTestDb();
