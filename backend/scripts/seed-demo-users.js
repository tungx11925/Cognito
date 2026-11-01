// Seed thêm user demo trực tiếp vào DB (tránh giới hạn 10 lần đăng ký / 15 phút của API).
// - User đã tạo trước đó bằng @example.com được đổi sang email/SĐT mới.
// - User chưa có thì INSERT giống authService.register.
// Ngày tạo được san đều bởi backdate.service (USER_SLOTS) khi server khởi động lại
// hoặc khi admin gọi POST /api/admin/backdate-timeline.
// Dùng: DATABASE_URL="<chuỗi Supabase>" node scripts/seed-demo-users.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = 'Demo@12345';

// [tên, hậu tố email, SĐT]
const people = [
  ['Phan Minh Quân', '2005', '0912487315'], ['Hồ Thị Ngọc Ánh', '.04', '0389152704'],
  ['Lý Gia Bảo', '0312', '0978341266'], ['Tạ Quỳnh Như', '2k5', '0356820947'],
  ['Châu Đức Thịnh', '99', '0868142573'], ['Kiều Thanh Hà', '.2004', '0945730186'],
  ['Mạc Văn Tuấn', '1508', '0337096421'], ['Lâm Bảo Ngọc', '2003', '0703581294'],
  ['Trịnh Hoài Nam', '.hn', '0981625037'], ['Đoàn Thu Trang', '0207', '0396274185'],
  ['Huỳnh Tấn Phát', '2004', '0907413852'], ['Vương Khánh Linh', '.vkl', '0763298410'],
  ['Cao Minh Trí', '2k4', '0832569174'], ['La Thị Mỹ Duyên', '2006', '0378415269'],
  ['Quách Gia Huy', '1102', '0965183740'], ['Từ Ngọc Hân', '.05', '0359627481'],
  ['Ông Thế Vinh', '2003', '0918270364'], ['Lưu Phương Thảo', '2410', '0343819052'],
  ['Tô Hoàng Long', '.dev', '0886401739'], ['Diệp Bảo Trâm', '2005', '0398752146'],
  ['Âu Quốc Khánh', '0609', '0971538620'], ['Nghiêm Thùy Dung', '2004', '0327614985'],
  ['Bế Văn Sơn', '2k3', '0839275016'], ['Thái Hồng Nhung', '.04', '0365049813'],
  ['Giang Minh Hiếu', '2006', '0904862571'], ['Khúc Thanh Tùng', '1903', '0382517946'],
  ['Hà Kim Oanh', '2005', '0947360582'], ['Viên Đức Anh', '.va', '0705913628'],
  ['Mai Xuân Phúc', '2004', '0985247013'], ['Ninh Thị Yến', '3009', '0374681529'],
];

const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().split(' ');

const users = people.map(([name, suffix, phone], i) => {
  const parts = ascii(name);
  const given = parts.pop();
  return {
    name,
    phone,
    // "Phan Minh Quân" -> email mới quanpm2005@gmail.com, email cũ quan.phanminh1@example.com
    email: `${given}${parts.map((p) => p[0]).join('')}${suffix}@gmail.com`,
    oldEmail: `${given}.${parts.join('')}${i + 1}@example.com`,
  };
});

async function run() {
  const url = process.env.DATABASE_URL || '';
  const db = new Pool({ connectionString: url, ssl: url.includes('supabase') ? { rejectUnauthorized: false } : false });
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let created = 0, renamed = 0, skipped = 0;
  try {
    for (const u of users) {
      const exists = await db.query('SELECT 1 FROM users WHERE email = $1 OR phone = $2', [u.email, u.phone]);
      if (exists.rowCount) { skipped++; console.log(`ℹ️ ${u.email} đã có`); continue; }

      const upd = await db.query('UPDATE users SET email = $1, phone = $2 WHERE email = $3 RETURNING id', [u.email, u.phone, u.oldEmail]);
      if (upd.rowCount) { renamed++; console.log(`🔁 ${u.oldEmail} -> ${u.email} (ID ${upd.rows[0].id})`); continue; }

      const ins = await db.query('INSERT INTO users (email, phone, password, name) VALUES ($1, $2, $3, $4) RETURNING id', [u.email, u.phone, hash, u.name]);
      created++; console.log(`✅ ${u.email} (ID ${ins.rows[0].id})`);
    }
    const total = await db.query("SELECT count(*) FILTER (WHERE role <> 'admin') AS users, count(*) AS total FROM users");
    console.log(`\nMới tạo: ${created} | Đổi email: ${renamed} | Bỏ qua: ${skipped}`);
    console.log(`Tổng user (không tính admin): ${total.rows[0].users} | Tổng cả admin: ${total.rows[0].total}`);
  } finally {
    await db.end();
  }
}

run().catch((e) => { console.error('❌', e.message); process.exit(1); });
