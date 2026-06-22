import { db } from './index';

export const DEFAULT_CUSTOM_PROMPT = `- Phân bổ câu hỏi theo các mức nhận thức (Bloom's Taxonomy):
+ Nhận biết (0%): Hỏi định nghĩa, liệt kê, nhận diện khái niệm cơ bản.
+ Thông hiểu (20%): Giải thích, so sánh, phân biệt các khái niệm.
+ Vận dụng (40%): Áp dụng kiến thức vào tình huống cụ thể, giải quyết vấn đề thực tế.
+ Vận dụng cao (40%): Phân tích nguyên nhân-kết quả, đánh giá, tổng hợp, đề xuất giải pháp.
- Ưu tiên câu hỏi kích thích tư duy phân tích, không chỉ kiểm tra học thuộc lòng.

Tôi là một giảng viên cho môn "Đạo đức kinh doanh" tại trường đại học CMC, 1 trường tư. Môn học này được giảng dạy cho sinh viên năm 2 ngành các khối ngành kinh tế.
Phải phân bổ đáp án chia đều cho A, B, C, D, không được tập trung vào 1 loại đáp án từ đầu tới cuối, tỉ lệ phải là 25% mỗi đáp án.

B. Đối với bài test, cần bám sát nội dung bài học (Input)
1. Trắc nghiệm: Phân bổ đồng đều đáp án ABCD
2. Điền từ: các định nghĩa có trong slide, có thể có nhiều cách điền đáp án đúng, miễn là cùng ý nghĩa
3. Bám sát chuẩn đầu ra Môn học`;

export async function bootstrapAITestSchema() {
  try {
    // Step 1 — Create base tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_task_configs (
        id SERIAL PRIMARY KEY,
        course_id VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        use_custom_prompt BOOLEAN DEFAULT true,
        custom_prompt TEXT,
        multiple_choice_count INTEGER DEFAULT 10,
        multiple_choice_score NUMERIC(4,2) DEFAULT 1.0,
        fill_blank_count INTEGER DEFAULT 5,
        fill_blank_score NUMERIC(4,2) DEFAULT 1.0,
        essay_count INTEGER DEFAULT 2,
        essay_score NUMERIC(4,2) DEFAULT 2.0,
        true_false_count INTEGER DEFAULT 5,
        true_false_score NUMERIC(4,2) DEFAULT 0.5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_sets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        config_id INTEGER REFERENCES ai_task_configs(id) ON DELETE SET NULL,
        total_questions INTEGER DEFAULT 0,
        total_score NUMERIC(6,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        test_set_id INTEGER REFERENCES test_sets(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        score NUMERIC(4,2) DEFAULT 1.0,
        options JSONB,
        correct_answer JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 2 — Create enums safely (separate queries to avoid transaction conflict)
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK', 'ESSAY', 'TRUE_FALSE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        CREATE TYPE question_status AS ENUM ('DRAFT', 'APPROVED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Step 3 — Add enum columns to questions (safe upgrade)
    await db.query(`
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS status question_status NOT NULL DEFAULT 'DRAFT';
    `);

    // Step 4 — Add user_id to ai_task_configs (safe upgrade)
    await db.query(`
      ALTER TABLE ai_task_configs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    `);

    // Step 5 — Drop old UNIQUE CONSTRAINT on course_id (it's a constraint, not just an index)
    await db.query(`
      ALTER TABLE ai_task_configs DROP CONSTRAINT IF EXISTS ai_task_configs_course_id_key;
    `);

    // Step 6 — Create new unique index scoped per (course_id, user_id)
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ai_task_configs_user_course ON ai_task_configs(course_id, user_id);
    `);

    console.log('AI Test schema bootstrapped successfully.');
  } catch (err) {
    console.error('AI Test schema bootstrap error:', err);
  }
}
