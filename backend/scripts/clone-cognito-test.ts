import { Client } from 'pg';

async function cloneDatabase() {
  const rootClient = new Client('postgresql://tu:123@localhost:5432/postgres');
  await rootClient.connect();
  try {
    console.log('Terminating connections to cognito and cognito_test...');
    await rootClient.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname IN ('cognito', 'cognito_test')
        AND pid <> pg_backend_pid();
    `);

    console.log('Dropping existing cognito_test if any...');
    await rootClient.query('DROP DATABASE IF EXISTS cognito_test');

    console.log('Cloning cognito to cognito_test with TEMPLATE cognito...');
    await rootClient.query('CREATE DATABASE cognito_test WITH TEMPLATE cognito');

    console.log('✅ Successfully cloned cognito to cognito_test!');
  } catch (err: any) {
    console.error('Error cloning database:', err.message);
  } finally {
    await rootClient.end();
  }
}

cloneDatabase();
