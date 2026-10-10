/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Foreign Key Performance & Cascade Indexes
  // Prevents sequential full table scans during child FK lookups, updates, and cascading deletes
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON community_comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_community_resources_original_author_id ON community_resources(original_author_id);
    CREATE INDEX IF NOT EXISTS idx_content_reports_reviewed_by ON content_reports(reviewed_by);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_sender_id ON conversations(last_sender_id);
    CREATE INDEX IF NOT EXISTS idx_flashcard_decks_forked_from_id ON flashcard_decks(forked_from_id);
    CREATE INDEX IF NOT EXISTS idx_flashcards_document_id ON flashcards(document_id);
    CREATE INDEX IF NOT EXISTS idx_generation_jobs_document_id ON generation_jobs(document_id);
    CREATE INDEX IF NOT EXISTS idx_generation_jobs_result_deck_id ON generation_jobs(result_deck_id);
    CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_match_game_leaderboards_user_id ON match_game_leaderboards(user_id);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_report_id ON moderation_logs(report_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_plan_id ON payment_orders(plan_id);
    CREATE INDEX IF NOT EXISTS idx_purchased_resources_deck_id ON purchased_resources(deck_id);
    CREATE INDEX IF NOT EXISTS idx_purchased_resources_document_id ON purchased_resources(document_id);
    CREATE INDEX IF NOT EXISTS idx_purchased_resources_user_id ON purchased_resources(user_id);
    CREATE INDEX IF NOT EXISTS idx_questions_source_chunk_id ON questions(source_chunk_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_document_id ON quiz_attempts(document_id);
    CREATE INDEX IF NOT EXISTS idx_shared_links_deck_id ON shared_links(deck_id);
    CREATE INDEX IF NOT EXISTS idx_shared_links_document_id ON shared_links(document_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_document_id ON study_sessions(document_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_learning_goal_id ON study_sessions(learning_goal_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_quiz_id ON study_sessions(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
    CREATE INDEX IF NOT EXISTS idx_test_sets_ai_model_id ON test_sets(ai_model_id);
    CREATE INDEX IF NOT EXISTS idx_test_sets_config_id ON test_sets(config_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_document_id ON transactions(document_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  `);

  // 2. Strict Nullability on questions.test_set_id (Questions must belong to a test set)
  // Safely clean up any legacy orphaned questions with NULL test_set_id before applying the constraint,
  // preventing migration failure when running against historical databases or backups.
  pgm.sql(`
    DELETE FROM questions WHERE test_set_id IS NULL;
    ALTER TABLE questions ALTER COLUMN test_set_id SET NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE questions ALTER COLUMN test_set_id DROP NOT NULL;

    DROP INDEX IF EXISTS idx_community_comments_parent_id;
    DROP INDEX IF EXISTS idx_community_comments_user_id;
    DROP INDEX IF EXISTS idx_community_resources_original_author_id;
    DROP INDEX IF EXISTS idx_content_reports_reviewed_by;
    DROP INDEX IF EXISTS idx_conversations_last_sender_id;
    DROP INDEX IF EXISTS idx_flashcard_decks_forked_from_id;
    DROP INDEX IF EXISTS idx_flashcards_document_id;
    DROP INDEX IF EXISTS idx_generation_jobs_document_id;
    DROP INDEX IF EXISTS idx_generation_jobs_result_deck_id;
    DROP INDEX IF EXISTS idx_generation_jobs_user_id;
    DROP INDEX IF EXISTS idx_match_game_leaderboards_user_id;
    DROP INDEX IF EXISTS idx_moderation_logs_report_id;
    DROP INDEX IF EXISTS idx_payment_orders_plan_id;
    DROP INDEX IF EXISTS idx_purchased_resources_deck_id;
    DROP INDEX IF EXISTS idx_purchased_resources_document_id;
    DROP INDEX IF EXISTS idx_purchased_resources_user_id;
    DROP INDEX IF EXISTS idx_questions_source_chunk_id;
    DROP INDEX IF EXISTS idx_quiz_attempts_document_id;
    DROP INDEX IF EXISTS idx_shared_links_deck_id;
    DROP INDEX IF EXISTS idx_shared_links_document_id;
    DROP INDEX IF EXISTS idx_study_sessions_document_id;
    DROP INDEX IF EXISTS idx_study_sessions_learning_goal_id;
    DROP INDEX IF EXISTS idx_study_sessions_quiz_id;
    DROP INDEX IF EXISTS idx_subscriptions_plan_id;
    DROP INDEX IF EXISTS idx_test_sets_ai_model_id;
    DROP INDEX IF EXISTS idx_test_sets_config_id;
    DROP INDEX IF EXISTS idx_transactions_document_id;
    DROP INDEX IF EXISTS idx_transactions_user_id;
  `);
};
