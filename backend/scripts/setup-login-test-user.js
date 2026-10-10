const { db } = require('../dist/db/index');
const bcrypt = require('bcryptjs');

async function run() {
  const password = process.env.TEST_USER_PASSWORD || 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  // 1. Regular User
  const userEmail = 'benchmark_user@cognito.test';
  const userPhone = '0988776655';
  const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [userEmail]);
  if (userCheck.rows.length === 0) {
    await db.query(
      'INSERT INTO users (email, name, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
      [userEmail, 'Benchmark User', hash, userPhone, 'user']
    );
    console.log('Created test user:', userEmail);
  } else {
    await db.query('UPDATE users SET password = $1, is_suspended = false, role = $2 WHERE email = $3', [hash, 'user', userEmail]);
    console.log('Updated test user:', userEmail);
  }

  // 2. Admin User
  const adminEmail = 'benchmark_admin@cognito.test';
  const adminPhone = '0988112233';
  const adminCheck = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (adminCheck.rows.length === 0) {
    await db.query(
      'INSERT INTO users (email, name, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
      [adminEmail, 'Benchmark Admin', hash, adminPhone, 'admin']
    );
    console.log('Created test admin:', adminEmail);
  } else {
    await db.query('UPDATE users SET password = $1, is_suspended = false, role = $2 WHERE email = $3', [hash, 'admin', adminEmail]);
    console.log('Updated test admin:', adminEmail);
  }
}

run()
  .then(() => db.end())
  .catch((e) => {
    console.error(e);
    db.end();
  });
