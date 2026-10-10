import { db } from '../src/db';

async function checkNulls() {
  const r = await db.query(`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND (
        (table_name = 'document_chunks' AND column_name = 'document_id') OR
        (table_name = 'notes' AND column_name = 'user_id') OR
        (table_name = 'notes' AND column_name = 'document_id') OR
        (table_name = 'flashcards' AND column_name = 'deck_id') OR
        (table_name = 'questions' AND column_name = 'test_set_id')
      );
  `);
  console.log('Nullability check:', r.rows);

  // Check cascade behaviors
  const cascadeRes = await db.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND rc.delete_rule IN ('CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION')
    ORDER BY rc.delete_rule, tc.table_name;
  `);

  console.log('\n--- Cascade/Restrict/Set Null Rules Count ---');
  const rulesCount: Record<string, number> = {};
  cascadeRes.rows.forEach(r => {
    rulesCount[r.delete_rule] = (rulesCount[r.delete_rule] || 0) + 1;
  });
  console.log(rulesCount);

  process.exit(0);
}

checkNulls().catch(e => { console.error(e); process.exit(1); });
