// Đăng ký thêm user demo (@example.com) qua API register.
// Ngày tạo được san đều bởi backdate.service (USER_SLOTS) khi server khởi động lại
// hoặc khi admin gọi POST /api/admin/backdate-timeline.
// Dùng: node scripts/seed-demo-users.js [baseUrl]
const BASE_URL = process.argv[2] || 'https://cognito-backend-onax.onrender.com';
const DEFAULT_PASSWORD = 'Demo@12345';

const names = [
  'Phan Minh Quân', 'Hồ Thị Ngọc Ánh', 'Lý Gia Bảo', 'Tạ Quỳnh Như', 'Châu Đức Thịnh',
  'Kiều Thanh Hà', 'Mạc Văn Tuấn', 'Lâm Bảo Ngọc', 'Trịnh Hoài Nam', 'Đoàn Thu Trang',
  'Huỳnh Tấn Phát', 'Vương Khánh Linh', 'Cao Minh Trí', 'La Thị Mỹ Duyên', 'Quách Gia Huy',
  'Từ Ngọc Hân', 'Ông Thế Vinh', 'Lưu Phương Thảo', 'Tô Hoàng Long', 'Diệp Bảo Trâm',
  'Âu Quốc Khánh', 'Nghiêm Thùy Dung', 'Bế Văn Sơn', 'Thái Hồng Nhung', 'Giang Minh Hiếu',
  'Khúc Thanh Tùng', 'Hà Kim Oanh', 'Viên Đức Anh', 'Mai Xuân Phúc', 'Ninh Thị Yến',
];

// "Phan Minh Quân" -> "quan.phanminh"
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().split(' ');
const users = names.map((name, i) => {
  const parts = slug(name);
  return {
    name,
    email: `${parts.pop()}.${parts.join('')}${i + 1}@example.com`,
    phone: `0982${String(1000001 + i).slice(1)}`,
    password: DEFAULT_PASSWORD,
  };
});

async function run() {
  let created = 0, existed = 0, failed = 0;
  for (const [i, u] of users.entries()) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-test': 'true' },
        body: JSON.stringify(u),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) { created++; console.log(`[${i + 1}] ✅ ${u.email} (ID ${data?.data?.user?.id ?? data?.user?.id ?? '?'})`); }
      else if (res.status === 400 && /đã được sử dụng/.test(JSON.stringify(data))) { existed++; console.log(`[${i + 1}] ℹ️ ${u.email} đã tồn tại`); }
      else { failed++; console.log(`[${i + 1}] ❌ ${u.email}`, res.status, data); }
    } catch (e) { failed++; console.log(`[${i + 1}] ❌ ${u.email}`, e.message); }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`\nMới tạo: ${created} | Đã tồn tại: ${existed} | Lỗi: ${failed}`);
}

run();
