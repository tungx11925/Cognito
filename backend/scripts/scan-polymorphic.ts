import { db } from '../src/db';

async function testPolymorphic() {
  console.log('--- Scanning Polymorphic community_resources ---');
  // 1. community_resources -> documents
  const r1 = await db.query(`
    SELECT cr.id, cr.resource_id, cr.resource_type 
    FROM community_resources cr
    LEFT JOIN documents d ON cr.resource_id = d.id
    WHERE cr.resource_type = 'document' AND d.id IS NULL
  `);
  console.log('Orphan community_resources (document):', r1.rows.length, r1.rows);

  // 2. community_resources -> test_sets
  const r2 = await db.query(`
    SELECT cr.id, cr.resource_id, cr.resource_type 
    FROM community_resources cr
    LEFT JOIN test_sets ts ON cr.resource_id = ts.id
    WHERE cr.resource_type = 'test_set' AND ts.id IS NULL
  `);
  console.log('Orphan community_resources (test_set):', r2.rows.length, r2.rows);

  // 3. community_resources -> flashcard_decks
  const r3 = await db.query(`
    SELECT cr.id, cr.resource_id, cr.resource_type 
    FROM community_resources cr
    LEFT JOIN flashcard_decks fd ON cr.resource_id = fd.id
    WHERE cr.resource_type = 'flashcard_deck' AND fd.id IS NULL
  `);
  console.log('Orphan community_resources (flashcard_deck):', r3.rows.length, r3.rows);

  console.log('--- Scanning Polymorphic content_reports ---');
  const crOrphans = await db.query(`
    SELECT r.id, r.target_type, r.target_id
    FROM content_reports r
    WHERE (r.target_type = 'document' AND NOT EXISTS (SELECT 1 FROM documents WHERE id = r.target_id))
       OR (r.target_type = 'user' AND NOT EXISTS (SELECT 1 FROM users WHERE id = r.target_id))
       OR (r.target_type = 'resource' AND NOT EXISTS (SELECT 1 FROM community_resources WHERE id = r.target_id))
       OR (r.target_type = 'comment' AND NOT EXISTS (SELECT 1 FROM community_comments WHERE id = r.target_id))
  `);
  console.log('Orphan content_reports:', crOrphans.rows.length, crOrphans.rows);

  console.log('--- Scanning Polymorphic moderation_logs ---');
  const modOrphans = await db.query(`
    SELECT m.id, m.target_type, m.target_id
    FROM moderation_logs m
    WHERE (m.target_type = 'user' AND NOT EXISTS (SELECT 1 FROM users WHERE id = m.target_id))
       OR (m.target_type = 'resource' AND NOT EXISTS (SELECT 1 FROM community_resources WHERE id = m.target_id))
       OR (m.target_type = 'document' AND NOT EXISTS (SELECT 1 FROM documents WHERE id = m.target_id))
  `);
  console.log('Orphan moderation_logs:', modOrphans.rows.length, modOrphans.rows);

  process.exit(0);
}

testPolymorphic().catch(e => { console.error(e); process.exit(1); });
