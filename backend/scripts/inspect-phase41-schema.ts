import { db } from '../src/db';

async function check() {
  const fcCols = await db.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'flashcards'
    ORDER BY ordinal_position
  `);

  const deckCols = await db.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'flashcard_decks'
    ORDER BY ordinal_position
  `);

  const promptTemplates = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('ai_prompt_templates', 'ai_prompt_history', 'flashcard_study_settings', 'deck_drafts')
  `);

  console.log('FLASHCARDS COLUMNS:');
  console.table(fcCols.rows);

  console.log('FLASHCARD_DECKS COLUMNS:');
  console.table(deckCols.rows);

  console.log('EXISTING PHASE 41 TABLES:', promptTemplates.rows);

  await db.end();
}

check().catch(console.error);
