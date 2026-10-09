exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_feedbacks (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      category VARCHAR(100) NOT NULL DEFAULT 'Giao diện & Trải nghiệm',
      comment TEXT NOT NULL,
      page_url VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON user_feedbacks(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON user_feedbacks(rating);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS user_feedbacks;`);
};
