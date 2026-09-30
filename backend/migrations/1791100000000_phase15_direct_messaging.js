/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  // 1. Conversations Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      last_message_text TEXT,
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_text TEXT;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'user1_id'
      ) THEN
        ALTER TABLE conversations ALTER COLUMN user1_id DROP NOT NULL;
        ALTER TABLE conversations ALTER COLUMN user2_id DROP NOT NULL;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations (last_message_at DESC);
  `);

  // 2. Conversation Members Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS conversation_members (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      unread_count INTEGER NOT NULL DEFAULT 0,
      last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_conversation_member UNIQUE (conversation_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members (user_id);
    CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members (conversation_id);
  `);

  // 3. Messages Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      message_type VARCHAR(20) NOT NULL DEFAULT 'text',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) NOT NULL DEFAULT 'text';

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);
  `);

  // 4. Message Reads Table
  await pgm.sql(`
    CREATE TABLE IF NOT EXISTS message_reads (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_message_read UNIQUE (message_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads (user_id);
    CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads (message_id);
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP TABLE IF EXISTS message_reads CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS conversation_members CASCADE;
    DROP TABLE IF EXISTS conversations CASCADE;
  `);
};
