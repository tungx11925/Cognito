exports.up = async (pgm) => {
  // 1. Create friendships table
  pgm.createTable('friendships', {
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
  });

  // Unique constraint to prevent duplicate friendships
  pgm.addConstraint('friendships', 'unique_user_friend', {
    unique: ['user_id', 'friend_id']
  });

  // 2. Create user_daily_tasks table
  pgm.createTable('user_daily_tasks', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    task_date: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
    task_type: { type: 'varchar(50)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    target_value: { type: 'integer', notNull: true },
    current_value: { type: 'integer', notNull: true, default: 0 },
    is_completed: { type: 'boolean', notNull: true, default: false },
    is_notified: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Unique constraint for user tasks per day
  pgm.addConstraint('user_daily_tasks', 'unique_user_task_date_type', {
    unique: ['user_id', 'task_date', 'task_type']
  });

  // 3. Seed some additional users for friends list
  pgm.sql(`
    INSERT INTO users (email, password, name, phone, education, address) VALUES
    ('trancuong@edushare.com', '$2a$10$U.9aN4x6K03WwFpL9Zg.y.e6fXoK5dJ0Fv7XgH1T.y6e7z.H3Wk4y', 'Trần Văn Cường', '0912345678', 'Đại học Bách Khoa', 'Hà Nội'),
    ('lehoa@edushare.com', '$2a$10$U.9aN4x6K03WwFpL9Zg.y.e6fXoK5dJ0Fv7XgH1T.y6e7z.H3Wk4y', 'Lê Thị Hoa', '0987654321', 'Đại học Quốc gia', 'TP. Hồ Chí Minh'),
    ('phamminh@edushare.com', '$2a$10$U.9aN4x6K03WwFpL9Zg.y.e6fXoK5dJ0Fv7XgH1T.y6e7z.H3Wk4y', 'Phạm Bình Minh', '0901234567', 'Đại học Ngoại thương', 'Đà Nẵng');
  `);

  // 4. Seed friendships for hocvien@edushare.com (user_id = 2)
  // Let's connect user 2 with users 1 (admin), 3 (trancuong), 4 (lehoa), 5 (phamminh)
  pgm.sql(`
    INSERT INTO friendships (user_id, friend_id, status) VALUES
    (2, 1, 'accepted'),
    (2, 3, 'accepted'),
    (2, 4, 'accepted'),
    (2, 5, 'accepted');
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('user_daily_tasks');
  pgm.dropTable('friendships');
};
