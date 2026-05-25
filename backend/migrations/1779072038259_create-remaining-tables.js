const bcrypt = require('bcryptjs');

exports.up = async (pgm) => {
  // 1. Create documents table
  pgm.createTable('documents', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    doc_url: { type: 'varchar(255)' },
    solution_text: { type: 'text' },
    solution_url: { type: 'varchar(255)' },
    category: { type: 'varchar(100)' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 2. Create study_sessions table
  pgm.createTable('study_sessions', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    document_id: {
      type: 'integer',
      notNull: true,
      references: '"documents"',
      onDelete: 'CASCADE',
    },
    duration_seconds: { type: 'integer', notNull: true },
    started_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 3. Create notes table
  pgm.createTable('notes', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    document_id: {
      type: 'integer',
      notNull: true,
      references: '"documents"',
      onDelete: 'CASCADE',
    },
    title: { type: 'varchar(255)' },
    content: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 4. Create flashcard_decks table
  pgm.createTable('flashcard_decks', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 5. Create flashcards table
  pgm.createTable('flashcards', {
    id: { type: 'serial', primaryKey: true },
    deck_id: {
      type: 'integer',
      notNull: true,
      references: '"flashcard_decks"',
      onDelete: 'CASCADE',
    },
    document_id: {
      type: 'integer',
      references: '"documents"',
      onDelete: 'CASCADE',
    },
    front: { type: 'text', notNull: true },
    back: { type: 'text', notNull: true },
    ease_factor: { type: 'float', notNull: true, default: 2.5 },
    repetitions: { type: 'integer', notNull: true, default: 0 },
    interval_days: { type: 'integer', notNull: true, default: 0 },
    next_review_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // --- SEED BASIC DATA ---
  // Create some users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  // Insert users
  pgm.sql(`
    INSERT INTO users (email, password, name) VALUES
    ('admin@edushare.com', '${adminPasswordHash}', 'Admin Edushare'),
    ('hocvien@edushare.com', '${userPasswordHash}', 'Nguyễn Văn Học');
  `);

  // Insert documents
  pgm.sql(`
    INSERT INTO documents (user_id, title, description, doc_url, solution_text, solution_url, category) VALUES
    (1, 'Giới thiệu về Trí tuệ Nhân tạo (AI) và Học máy (Machine Learning)', 'Tài liệu nhập môn cung cấp kiến thức nền tảng về Trí tuệ nhân tạo, Học máy (Machine learning), Học sâu (Deep learning) và các ứng dụng thực tế của chúng.', 'https://example.com/docs/intro-to-ai.pdf', 'Lời giải chi tiết và tóm tắt kiến thức của chương 1:\\n- AI là trí tuệ nhân tạo.\\n- ML là một nhánh con của AI.\\n- DL là một nhánh con của ML.', 'https://example.com/docs/intro-to-ai-solution.pdf', 'Trí tuệ nhân tạo'),
    (1, 'Bài tập Giải tích 1 - Giới hạn và Đạo hàm', 'Tập hợp các bài toán giới hạn, liên tục và đạo hàm của hàm số một biến số kèm theo phương pháp giải chi tiết.', 'https://example.com/docs/calculus-1.pdf', '# Lời giải bài tập giới hạn:\\n1. lim_{x->0} (sin x)/x = 1.\\n2. Phương pháp L''Hospital áp dụng cho dạng vô định 0/0 hoặc vô cùng/vô cùng.', NULL, 'Toán học'),
    (2, 'Cẩm nang ôn thi IELTS Writing Task 2', 'Tài liệu hướng dẫn cách viết bài luận IELTS Writing Task 2, cách phân tích đề bài, lập dàn ý và các mẫu câu ghi điểm cao (Band 7.0+).', 'https://example.com/docs/ielts-writing-task2.pdf', 'Các từ vựng nâng cao nên dùng:\\n- Metamorphosis\\n- Ubiquitous\\n- Paradigm shift\\nDàn ý chung cho bài luận 4 đoạn: Introduction, Body 1, Body 2, Conclusion.', NULL, 'Ngoại ngữ');
  `);

  // Insert study sessions
  pgm.sql(`
    INSERT INTO study_sessions (user_id, document_id, duration_seconds) VALUES
    (2, 1, 1800),
    (2, 2, 3600),
    (2, 1, 1200);
  `);

  // Insert notes
  pgm.sql(`
    INSERT INTO notes (user_id, document_id, title, content) VALUES
    (2, 1, 'Các thuật toán ML cơ bản', 'Cần nhớ:\\n1. Supervised Learning: Linear Regression, Logistic Regression, SVM, Random Forest.\\n2. Unsupervised Learning: K-Means, PCA.\\n3. Reinforcement Learning: Q-learning.'),
    (2, 2, 'Công thức Đạo hàm lượng giác', 'sin''(x) = cos(x)\\ncos''(x) = -sin(x)\\ntan''(x) = 1/cos^2(x)\\ncotan''(x) = -1/sin^2(x)');
  `);

  // Insert flashcard decks
  pgm.sql(`
    INSERT INTO flashcard_decks (user_id, name, description) VALUES
    (2, 'Thuật ngữ AI cơ bản', 'Các khái niệm cơ bản về Trí tuệ nhân tạo cần nhớ trước khi thi cuối kỳ.'),
    (2, 'Từ vựng IELTS Task 2', 'Tổng hợp từ vựng học thuật ghi điểm trong bài viết Task 2.');
  `);

  // Insert flashcards
  pgm.sql(`
    INSERT INTO flashcards (deck_id, document_id, front, back, ease_factor, repetitions, interval_days) VALUES
    (1, 1, 'Supervised Learning là gì?', 'Học có giám sát, là phương pháp huấn luyện mô hình dựa trên tập dữ liệu đã có nhãn (labeled data).', 2.5, 0, 0),
    (1, 1, 'Overfitting là gì?', 'Hiện tượng mô hình quá khớp với dữ liệu huấn luyện, dẫn đến dự đoán kém trên dữ liệu mới thực tế.', 2.5, 0, 0),
    (2, 3, 'Ubiquitous nghĩa là gì?', 'Có mặt ở khắp mọi nơi, phổ biến (hơn cả common/popular). Ví dụ: Smartphones have become ubiquitous in modern society.', 2.5, 0, 0);
  `);
};

exports.down = pgm => {
  pgm.dropTable('flashcards');
  pgm.dropTable('flashcard_decks');
  pgm.dropTable('notes');
  pgm.dropTable('study_sessions');
  pgm.dropTable('documents');
};
