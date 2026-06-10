exports.up = pgm => {
  // 1. Thêm is_starred vào flashcards
  pgm.addColumn('flashcards', {
    is_starred: { type: 'boolean', default: false }
  });

  // 2. Thêm forked_from_id vào flashcard_decks
  pgm.addColumn('flashcard_decks', {
    forked_from_id: {
      type: 'integer',
      references: '"flashcard_decks"',
      onDelete: 'SET NULL',
      default: null
    }
  });

  // 3. Tạo bảng match_game_leaderboards
  pgm.createTable('match_game_leaderboards', {
    id: { type: 'serial', primaryKey: true },
    deck_id: {
      type: 'integer',
      notNull: true,
      references: '"flashcard_decks"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    time_ms: { type: 'integer', notNull: true },
    played_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('match_game_leaderboards', 'deck_id');
};

exports.down = pgm => {
  pgm.dropTable('match_game_leaderboards');
  pgm.dropColumn('flashcard_decks', 'forked_from_id');
  pgm.dropColumn('flashcards', 'is_starred');
};
