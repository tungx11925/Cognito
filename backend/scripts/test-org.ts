import { db } from '../src/db';
import axios from 'axios';
import jwt from 'jsonwebtoken';

async function run() {
  try {
    // 1. Create Org A and Org B
    const orgA = await db.query(`INSERT INTO organizations (name, school_code) VALUES ('Org A', 'ORGA_TEST_' || floor(random()*1000)) RETURNING id`);
    const orgB = await db.query(`INSERT INTO organizations (name, school_code) VALUES ('Org B', 'ORGB_TEST_' || floor(random()*1000)) RETURNING id`);
    const orgAId = orgA.rows[0].id;
    const orgBId = orgB.rows[0].id;

    // 2. Create User Admin A
    const userRes = await db.query(`INSERT INTO users (email, password, role) VALUES ('admin_a_' || floor(random()*1000) || '@test.com', 'pwd', 'student') RETURNING id`);
    const userId = userRes.rows[0].id;

    // 3. Add Admin A to Org A as school_admin
    await db.query(`INSERT INTO organization_members (organization_id, user_id, org_role) VALUES ($1, $2, 'school_admin')`, [orgAId, userId]);

    // 4. Generate token
    const token = jwt.sign({ id: userId, email: 'admin_a@test.com', role: 'student' }, process.env.JWT_SECRET_KEY as string, { expiresIn: '1h' });

    console.log('Testing Case A: Access Org A (Should be 200)');
    try {
      const resA = await axios.get(`http://localhost:5000/api/school/${orgAId}`, {
        headers: { Cookie: `token=${token}` }
      });
      console.log('Case A Result:', resA.status);
    } catch (e: any) {
      console.log('Case A Failed:', e.response?.status, e.response?.data);
    }

    console.log('Testing Case B: Access Org B (Should be 403)');
    try {
      const resB = await axios.get(`http://localhost:5000/api/school/${orgBId}`, {
        headers: { Cookie: `token=${token}` }
      });
      console.log('Case B Result:', resB.status);
    } catch (e: any) {
      console.log('Case B Failed:', e.response?.status, e.response?.data);
    }

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
