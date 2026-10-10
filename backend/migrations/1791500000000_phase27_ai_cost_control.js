/* eslint-disable camelcase */

/**
 * Migration: Phase 27 AI Security & Cost Control
 * - Thêm cột estimated_cost vào bảng ai_request_logs
 * - Cập nhật bảng giá chuẩn (input_cost, output_cost) cho các model trong ai_models
 * - Chuẩn hóa tên model Gemini (gemini-1.5-flash / gemini-1.5-pro)
 * - Tạo index cho việc tính tổng chi phí AI theo ngày
 */
exports.up = async (pgm) => {
  // 1. ai_request_logs: thêm cột estimated_cost
  await pgm.sql(`
    ALTER TABLE ai_request_logs
      ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12, 6) DEFAULT 0;

    CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_cost
      ON ai_request_logs(created_at, estimated_cost);
  `);

  // 2. Cập nhật chi phí chuẩn (USD trên 1 triệu tokens) cho các model
  // Groq models
  await pgm.sql(`
    UPDATE ai_models
    SET input_cost = 0.05, output_cost = 0.08
    WHERE model_name IN ('openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'groq/compound-mini');

    UPDATE ai_models
    SET input_cost = 0.59, output_cost = 0.79
    WHERE model_name IN ('openai/gpt-oss-120b', 'groq/compound', 'llama-3.3-70b-versatile');
  `);

  // Gemini models
  await pgm.sql(`
    UPDATE ai_models
    SET input_cost = 0.075, output_cost = 0.30
    WHERE model_name = 'gemini-1.5-flash';

    -- Chuẩn hóa gemini-3.6-flash thành gemini-1.5-pro (model chuẩn của Google)
    UPDATE ai_models
    SET model_name = 'gemini-1.5-pro',
        display_name = 'Gemini 1.5 Pro — phân tích chuyên sâu',
        input_cost = 1.25,
        output_cost = 5.00
    WHERE model_name = 'gemini-3.6-flash';
  `);
};

exports.down = async (pgm) => {
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_ai_request_logs_created_cost;
    ALTER TABLE ai_request_logs DROP COLUMN IF EXISTS estimated_cost;
  `);
};
