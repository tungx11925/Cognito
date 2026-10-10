import { db } from '../src/db';

async function purgeDevTestData() {
  console.log('=== PURGING TEST DATA FROM DEV DATABASE (USER-APPROVED) ===\n');

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Identify real users to protect
    const realUserIds = [1, 2, 3, 5, 7, 8, 21, 22];
    console.log(`Protected real user IDs: ${realUserIds.join(', ')}`);

    // 2. Mark remaining users as is_test = true
    const markRes = await client.query(`
      UPDATE users 
      SET is_test = true 
      WHERE id NOT IN (${realUserIds.join(',')})
      RETURNING id, email, name
    `);
    console.log(`Marked ${markRes.rowCount} users as is_test = true`);

    // Also ensure real users are explicitly is_test = false
    await client.query(`
      UPDATE users 
      SET is_test = false 
      WHERE id IN (${realUserIds.join(',')})
    `);

    // 3. Delete test users and associated cascade data
    console.log('Deleting test users (cascade will clean up their orphaned records)...');
    const deleteUsersRes = await client.query(`
      DELETE FROM users 
      WHERE is_test = true
      RETURNING id
    `);
    console.log(`✅ Deleted ${deleteUsersRes.rowCount} test users from database.`);

    // 4. Delete orphan test documents (e.g. titled "Test Doc%", "Test Entitlement%", "Tài Liệu Ôn Tập Benchmark%")
    const deleteDocsRes = await client.query(`
      DELETE FROM documents 
      WHERE title ILIKE 'Test Doc%' 
         OR title ILIKE 'Test Entitlement%' 
         OR title ILIKE 'Tài Liệu Ôn Tập Benchmark%'
         OR title ILIKE '%Benchmark%'
      RETURNING id, title
    `);
    console.log(`✅ Deleted ${deleteDocsRes.rowCount} test documents from database.`);

    // 5. Clean up orphan test sets and questions created by tests
    const deleteTestSetsRes = await client.query(`
      DELETE FROM test_sets 
      WHERE name ILIKE '%Test%' 
         OR name ILIKE '%Benchmark%' 
         OR name ILIKE '%P30%' 
         OR name ILIKE '%Phase%'
      RETURNING id
    `);
    console.log(`✅ Deleted ${deleteTestSetsRes.rowCount} test_sets created by tests.`);

    // 6. Ensure or create System User "Thư viện mở" (Cognito Open Library)
    const openLibraryEmail = 'openlibrary@cognito.edu.vn';
    const checkLibraryRes = await client.query('SELECT id FROM users WHERE email = $1', [openLibraryEmail]);
    
    let libraryUserId: number;
    if (checkLibraryRes.rows.length === 0) {
      const createLibraryRes = await client.query(`
        INSERT INTO users (
          email, 
          password, 
          name, 
          role, 
          is_verified, 
          is_test, 
          bio, 
          headline
        ) VALUES (
          $1,
          '$2a$10$zjWs2mq2CEy2bDYrHcf/9OCQoaghH2BcY5gczZcwS5ST1lFtrHEhm',
          'Thư viện mở Cognito',
          'user',
          true,
          false,
          'Tài khoản chính thức của Thư viện Tài liệu Nguồn mở Cognito (Open Educational Resources - OER).',
          'Thư viện Tri thức Mở'
        ) RETURNING id
      `, [openLibraryEmail]);
      libraryUserId = createLibraryRes.rows[0].id;
      console.log(`✅ Created system user "Thư viện mở Cognito" with ID: ${libraryUserId}`);
    } else {
      libraryUserId = checkLibraryRes.rows[0].id;
      await client.query(`
        UPDATE users 
        SET is_test = false, is_verified = true, name = 'Thư viện mở Cognito'
        WHERE id = $1
      `, [libraryUserId]);
      console.log(`System user "Thư viện mở Cognito" already exists with ID: ${libraryUserId}`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 DB Clean up successfully committed!');

    // Verify remaining count
    const remainingUsers = await client.query('SELECT id, name, email, is_test FROM users ORDER BY id ASC');
    console.log(`\nRemaining users in database (${remainingUsers.rows.length}):`);
    remainingUsers.rows.forEach(u => console.log(`  [ID: ${u.id}] ${u.name} (${u.email}) - is_test: ${u.is_test}`));

    const remainingDocs = await client.query('SELECT id, title, user_id, is_test FROM documents ORDER BY id ASC');
    console.log(`\nRemaining documents in database (${remainingDocs.rows.length}):`);
    remainingDocs.rows.forEach(d => console.log(`  [ID: ${d.id}] "${d.title}" (User ${d.user_id}) - is_test: ${d.is_test}`));

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Purge failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

purgeDevTestData();
