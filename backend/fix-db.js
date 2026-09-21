const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://tu:123@localhost:5432/cognito?schema=public'
});

client.connect()
  .then(() => client.query('DELETE FROM pgmigrations WHERE name = $1', ['1780898629963_create-users-table']))
  .then(res => {
    console.log('Fixed migrations (rows deleted):', res.rowCount);
    return client.query('DELETE FROM pgmigrations WHERE name = $1', ['1780936000000_add_profile_fields_to_users']);
  })
  .then(res => {
     console.log('Fixed additional invalid migrations:', res.rowCount);
     return client.end();
  })
  .then(() => {
    console.log('Done. Bây giờ bạn có thể chạy: npm run dev');
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
