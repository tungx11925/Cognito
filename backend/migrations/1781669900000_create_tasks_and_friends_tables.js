exports.up = async (pgm) => {
  // 1. Create friendships table
  await pgm.createTable('friendships', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    friend_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    status: { type: 'varchar(20)', notNull: true, default: 'accepted' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });

  // Unique constraint to prevent duplicate friendships
  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_friend') THEN
        ALTER TABLE friendships ADD CONSTRAINT unique_user_friend UNIQUE (user_id, friend_id);
      END IF;
    END $$;
  `);

  // 2. Create user_daily_tasks table
  await pgm.createTable('user_daily_tasks', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    activity_date: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
    task_type: { type: 'varchar(50)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    target_value: { type: 'integer', notNull: true },
    current_value: { type: 'integer', notNull: true, default: 0 },
    completed: { type: 'boolean', notNull: true, default: false },
    is_notified: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });

  // Unique constraint for user tasks per day
  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_task_date_type') THEN
        ALTER TABLE user_daily_tasks ADD CONSTRAINT unique_user_task_date_type UNIQUE (user_id, activity_date, task_type);
      END IF;
    END $$;
  `);

  // 3. Seed some additional users for friends list safely
  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'trancuong@edushare.com' OR phone = '0912345678') THEN
        INSERT INTO users (email, password, name, phone, education, address)
        VALUES ('trancuong@edushare.com', '$2a$10$U.9aN4x6K03WwFpL9Zg.y.e6fXoK5dJ0Fv7XgH1T.y6e7z.H3Wk4y', 'Trần Văn Cường', '0912345678', 'Đại học Bách Khoa', 'Hà Nội');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'lehoa@edushare.com' OR phone = '0987654321') THEN
        INSERT INTO users (email, password, name, phone, education, address)
        VALUES ('lehoa@edushare.com', '$2a$10$U.9aN4x6K03WwFpL9Zg.y.e6fXoK5dJ0Fv7XgH1T.y6e7z.H3Wk4y', 'Lê Thị Hoa', '0987654321', 'Đại học Quốc gia', 'TP. Hồ Chí Minh');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'phamminh@edushare.com' OR phone = '0901234567') THEN
        INSERT INTO users (email, password, name, phone, education, address)
        VALUES ('phamminh@edushare.com', '$2a$10$U.9aN4x6K03WwFpL9Zg.y.e6fXoK5dJ0Fv7XgH1T.y6e7z.H3Wk4y', 'Phạm Bình Minh', '0901234567', 'Đại học Ngoại thương', 'Đà Nẵng');
      END IF;
    END $$;
  `);

  // 4. Seed friendships for user 2 if exists
  await pgm.sql(`
    INSERT INTO friendships (user_id, friend_id, status)
    SELECT 2, f.id, 'accepted'
    FROM users f
    WHERE f.id IN (1, 3, 4, 5) AND EXISTS (SELECT 1 FROM users WHERE id = 2)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('user_daily_tasks');
  pgm.dropTable('friendships');
};
