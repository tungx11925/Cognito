// Thêm đánh giá & góp ý cho các user demo (ID >= 49) chưa có đánh giá, tới khi tổng đạt TARGET.
// Ngày gửi được backdate.service tính lại theo ngày tạo user (+2..16 giờ) khi server khởi động.
// Dùng: node -r dotenv/config scripts/seed-demo-feedbacks.js dotenv_config_path=.env.production
require('dotenv').config();
const { Pool } = require('pg');

const TARGET = 60;

const PAGE = {
  'Flashcards & Ôn tập': '/flashcards',
  'Giao diện & Trải nghiệm': '/home',
  'Tốc độ AI & Trợ lý': '/ai-test',
  'Trắc nghiệm & Đề thi': '/quiz',
  'Đề xuất tính năng mới': '/home',
};

// [rating, category, comment]
const feedbacks = [
  [5, 'Trắc nghiệm & Đề thi', 'Up file đề cương môn Kinh tế vi mô lên là có ngay 30 câu trắc nghiệm, đáp án có giải thích nên ôn trước giờ thi đỡ hẳn.'],
  [4, 'Giao diện & Trải nghiệm', 'Giao diện gọn, dễ dùng. Trên điện thoại thì thanh menu hơi chiếm chỗ, mong có chế độ thu gọn.'],
  [5, 'Flashcards & Ôn tập', 'Tạo flashcard từ slide bài giảng nhanh thật, tối nào mình cũng ôn 15 phút trước khi ngủ.'],
  [5, 'Tốc độ AI & Trợ lý', 'Hỏi trợ lý AI về đoạn code Java bị lỗi, nó chỉ ra đúng chỗ sai và giải thích dễ hiểu.'],
  [4, 'Đề xuất tính năng mới', 'Mong có thêm tính năng học nhóm, chia sẻ bộ flashcard cho cả lớp cùng ôn.'],
  [5, 'Trắc nghiệm & Đề thi', 'Làm đề thử xong xem lại câu sai rất tiện, điểm tiến bộ dần qua từng lần làm.'],
  [5, 'Giao diện & Trải nghiệm', 'Chế độ tối dễ chịu, học buổi tối không bị chói mắt. Màu sắc hài hòa.'],
  [3, 'Tốc độ AI & Trợ lý', 'File PDF dài hơn 50 trang thì xử lý hơi lâu, phải đợi khá lâu mới ra kết quả.'],
  [5, 'Flashcards & Ôn tập', 'Chế độ lặp lại ngắt quãng giúp mình nhớ từ vựng tiếng Nhật lâu hơn hẳn so với học kiểu cũ.'],
  [4, 'Trắc nghiệm & Đề thi', 'Câu hỏi sinh ra khá sát nội dung, đôi khi có câu hơi dễ, mong thêm tùy chọn độ khó.'],
  [5, 'Tốc độ AI & Trợ lý', 'Sơ đồ tư duy tự tạo từ giáo trình giúp mình hệ thống lại cả chương Triết học trong một buổi.'],
  [5, 'Đề xuất tính năng mới', 'Streak học tập tạo động lực ghê, mong thêm huy hiệu khi giữ chuỗi 30 ngày.'],
  [4, 'Giao diện & Trải nghiệm', 'Thư viện tài liệu sắp xếp rõ ràng, nhưng ô tìm kiếm nên lọc được theo môn học.'],
  [5, 'Trắc nghiệm & Đề thi', 'Nhập đề cũ từ file Word vào là tự tách câu hỏi, tiết kiệm cho mình cả buổi gõ lại.'],
  [5, 'Flashcards & Ôn tập', 'Lật thẻ mượt, có thống kê thẻ nào hay quên để tập trung ôn lại.'],
  [5, 'Tốc độ AI & Trợ lý', 'Tóm tắt tài liệu nhanh và đúng ý chính, hợp với mấy môn đại cương nhiều chữ.'],
  [4, 'Đề xuất tính năng mới', 'Nên có nhắc lịch học qua email hoặc thông báo để đỡ quên ôn bài.'],
  [5, 'Giao diện & Trải nghiệm', 'Đăng ký dùng thử thấy hợp nên rủ cả nhóm bạn cùng lớp vào dùng, ai cũng khen dễ dùng.'],
  [5, 'Trắc nghiệm & Đề thi', 'Chấm điểm ngay sau khi nộp, có phân tích phần kiến thức còn yếu, rất đáng dùng mùa thi.'],
];

async function run() {
  const url = process.env.DATABASE_URL || '';
  const db = new Pool({ connectionString: url, ssl: url.includes('supabase') ? { rejectUnauthorized: false } : false });
  try {
    const total = Number((await db.query('SELECT count(*) FROM user_feedbacks')).rows[0].count);
    const need = Math.min(TARGET - total, feedbacks.length);
    if (need <= 0) return console.log(`Đã có ${total} đánh giá, không cần thêm.`);

    const users = (await db.query(
      `SELECT u.id, u.name, u.email FROM users u
       WHERE u.id >= 49 AND u.role <> 'admin'
         AND NOT EXISTS (SELECT 1 FROM user_feedbacks f WHERE f.user_id = u.id)
       ORDER BY (u.id * 7) % 31, u.id LIMIT $1`, [need])).rows; // xáo trộn cố định để không dồn vào các ID liền nhau

    for (const [i, u] of users.entries()) {
      const [rating, category, comment] = feedbacks[i];
      await db.query(
        'INSERT INTO user_feedbacks (user_id, user_name, user_email, rating, category, comment, page_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [u.id, u.name, u.email, rating, category, comment, PAGE[category]]);
      console.log(`✅ #${u.id} ${u.name} — ${rating}★ ${category}`);
    }
    console.log(`\nĐã thêm ${users.length} | Tổng đánh giá: ${total + users.length}`);
  } finally {
    await db.end();
  }
}

run().catch((e) => { console.error('❌', e.message); process.exit(1); });
