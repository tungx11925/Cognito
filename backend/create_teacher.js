require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const hash = await bcrypt.hash('teacher123', 10);
  await pool.query(
    "INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET role=$4, password=$3",
    ['Teacher Edu', 'teacher', hash, 'teacher', true]
  );
  console.log('Teacher account created successfully (teacher / teacher123)');
  pool.end();
}
run();
