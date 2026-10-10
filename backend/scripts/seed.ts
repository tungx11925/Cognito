import { db } from '../src/db';

/**
 * Cognito Development Database Seed Script
 * 
 * IMPORTANT: This script is exclusively intended for local development and staging environments.
 * Master Prompt Phase 29 Rule: "Production không dùng mock. Nếu cần development seed: database seed phải được phân biệt rõ với production data."
 */
async function runSeed() {
  console.log('========================================================');
  console.log('       COGNITO DEVELOPMENT DATABASE SEED ENGINE        ');
  console.log('========================================================\n');

  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ FATAL: Cannot run development seed script in PRODUCTION environment!');
    process.exit(1);
  }

  try {
    // 1. Verify Core Subscription Plans
    console.log('[SEED] Checking core subscription plans...');
    const plansCheck = await db.query('SELECT COUNT(*) FROM subscription_plans');
    if (parseInt(plansCheck.rows[0].count, 10) === 0) {
      console.log('[SEED] Seeding subscription plans (FREE, PRO_MONTHLY, PRO_YEARLY)...');
      await db.query(`
        INSERT INTO subscription_plans (name, plan_type, price, billing_cycle, features, is_active)
        VALUES 
          ('Gói Miễn Phí', 'FREE', 0, 'lifetime', '{"ai_chat_limit":20,"question_gen_limit":10,"doc_limit":5,"doc_max_pages":20}', true),
          ('Gói Pro Tháng', 'PRO_MONTHLY', 99000, 'monthly', '{"ai_chat_limit":-1,"question_gen_limit":-1,"doc_limit":-1,"doc_max_pages":200}', true),
          ('Gói Pro Năm', 'PRO_YEARLY', 899000, 'yearly', '{"ai_chat_limit":-1,"question_gen_limit":-1,"doc_limit":-1,"doc_max_pages":200}', true)
        ON CONFLICT DO NOTHING;
      `);
      console.log('  ✓ Subscription plans seeded.');
    } else {
      console.log('  ✓ Subscription plans already present.');
    }

    // 2. Verify AI Models Catalog
    console.log('[SEED] Checking AI models catalog...');
    const modelsCheck = await db.query('SELECT COUNT(*) FROM ai_models');
    if (parseInt(modelsCheck.rows[0].count, 10) === 0) {
      console.log('[SEED] Seeding default AI models...');
      await db.query(`
        INSERT INTO ai_models (name, provider, model_name, tier, is_active, input_cost, output_cost)
        VALUES 
          ('Llama 3.3 70B Versatile (Groq)', 'groq', 'llama-3.3-70b-versatile', 'free', true, 0.59, 0.79),
          ('Gemini 1.5 Flash (Google)', 'gemini', 'gemini-1.5-flash', 'free', true, 0.075, 0.30)
        ON CONFLICT DO NOTHING;
      `);
      console.log('  ✓ AI models catalog seeded.');
    } else {
      console.log('  ✓ AI models catalog already present.');
    }

    // 3. Optional Sample Lecture for Development Testing
    console.log('[SEED] Checking sample lecture for development testing...');
    const lectureCheck = await db.query('SELECT COUNT(*) FROM lectures');
    if (parseInt(lectureCheck.rows[0].count, 10) === 0) {
      console.log('[SEED] Seeding sample developer lecture (Introduction to Machine Learning)...');
      const lectureRes = await db.query(`
        INSERT INTO lectures (title, description, subject, chapter_count, total_slides, cover_color)
        VALUES (
          'Introduction to Machine Learning [DEV SEED]',
          'Giáo trình bài giảng Trí tuệ Nhân tạo & Học máy chuyên sâu dành cho Giảng viên (Dữ liệu mẫu môi trường Dev)',
          'Trí tuệ nhân tạo',
          1,
          2,
          '#0A1128'
        ) RETURNING id;
      `);
      const lectureId = lectureRes.rows[0].id;
      await db.query(`
        INSERT INTO lecture_slides (lecture_id, slide_number, chapter_index, chapter_title, title, subtitle, content, callout_type, callout_title, callout_content, speaker_notes)
        VALUES 
          ($1, 1, 1, 'Chapter 1: Neural Networks', 'Chapter 1: Neural Networks and Deep Learning', '1.1 INTRODUCTION', 'A neural network is a computational model inspired by the brain.', 'definition', 'Definition', 'A neural network maps input data to output predictions.', 'Speaker notes sample.'),
          ($1, 2, 1, 'Chapter 1: Neural Networks', 'Biological vs Artificial Neurons', '1.2 BIOLOGICAL INSPIRATION', 'In the human brain, neurons communicate via electrical signals across synapses.', 'formula', 'Formula', 'y = sigma(w^T x + b)', 'Speaker notes sample.')
      `, [lectureId]);
      console.log('  ✓ Sample developer lecture seeded.');
    } else {
      console.log('  ✓ Lectures already present.');
    }

    console.log('\n========================================================');
    console.log('  ✓ SEED COMPLETED SUCCESSFULLY (DEV/TEST ISOLATED)     ');
    console.log('========================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ SEED FAILED:', err);
    process.exit(1);
  }
}

runSeed();
