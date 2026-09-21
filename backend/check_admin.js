const { Pool } = require('pg');

const pool = new Pool({
  user: 'tu',
  host: 'localhost',
  database: 'cognito',
  password: '123',
  port: 5432,
});

pool.query("SELECT * FROM users WHERE email = 'admin' OR name = 'admin'", (err, res) => {
  if (err) {
    console.error('Error fetching admin:', err);
  } else {
    console.log(`Found ${res.rowCount} users:`);
    console.log(res.rows);
  }
  pool.end();
});
