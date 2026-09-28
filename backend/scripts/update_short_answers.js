const { db } = require('../dist/db');

async function updateCards() {
  const cards = [
    {
      front: 'REST API là gì và các phương thức HTTP phổ biến nhất?',
      back: 'Kiến trúc web giao tiếp qua HTTP, không lưu trạng thái.\nGET · POST · PUT · PATCH · DELETE'
    },
    {
      front: 'Khác biệt cơ bản giữa Cơ sở dữ liệu SQL và NoSQL là gì?',
      back: 'SQL: Bảng, schema cố định, hỗ trợ ACID (PostgreSQL, MySQL).\nNoSQL: Phi quan hệ, linh hoạt, scale ngang dễ (MongoDB, Redis).'
    },
    {
      front: 'Nguyên lý ACID trong hệ quản trị cơ sở dữ liệu gồm những gì?',
      back: 'A – Atomicity: Giao dịch toàn vẹn hoặc rollback.\nC – Consistency: Dữ liệu luôn hợp lệ.\nI – Isolation: Giao dịch độc lập nhau.\nD – Durability: Dữ liệu bền vĩnh cửu.'
    },
    {
      front: 'JWT (JSON Web Token) hoạt động như thế nào trong xác thực người dùng?',
      back: '3 phần: Header · Payload · Signature.\nServer verify chữ ký, không cần lưu session.'
    },
    {
      front: 'Docker và Containerization giải quyết vấn đề gì trong phát triển phần mềm?',
      back: 'Đóng gói app + dependencies vào container độc lập.\nLoại bỏ lỗi "Works on my machine", nhẹ hơn VM.'
    },
    {
      front: 'CI/CD (Continuous Integration / Continuous Deployment) là gì?',
      back: 'CI: Tự động build & test khi push code.\nCD: Tự động deploy lên production khi pass test.'
    },
    {
      front: '4 tính chất cốt lõi của Lập trình Hướng Đối Tượng (OOP) là gì?',
      back: '1. Encapsulation – Đóng gói\n2. Inheritance – Kế thừa\n3. Polymorphism – Đa hình\n4. Abstraction – Trừu tượng'
    },
    {
      front: 'Event Loop trong JavaScript hoạt động như thế nào?',
      back: 'Single-thread, kiểm tra Call Stack.\nƯu tiên: Microtask Queue (Promise) → Macrotask Queue (setTimeout).'
    },
    {
      front: 'Closure trong JavaScript là gì và ứng dụng thực tế?',
      back: 'Hàm ghi nhớ biến của scope cha dù cha đã kết thúc.\nDùng: private variable, module pattern, memoization.'
    },
    {
      front: 'Kiến trúc Microservices khác Monolith như thế nào?',
      back: 'Monolith: 1 codebase, 1 DB, deploy cùng khối.\nMicroservices: Service độc lập, DB riêng, deploy riêng.'
    },
    {
      front: 'Caching (Bộ nhớ đệm) với Redis mang lại lợi ích gì?',
      back: 'Lưu key-value trên RAM, truy xuất < 1ms.\nGiảm tải DB, tăng tốc API, chịu traffic đột biến.'
    },
    {
      front: 'Git Rebase khác Git Merge như thế nào?',
      back: 'Merge: Giữ lịch sử nhánh, tạo merge commit.\nRebase: Đặt commit lên đỉnh nhánh đích, lịch sử thẳng.'
    },
    {
      front: 'Mã trạng thái HTTP Status Code phổ biến (200, 201, 400, 401, 403, 404, 500) biểu thị điều gì?',
      back: '200 OK · 201 Created\n400 Bad Request · 401 Unauthorized\n403 Forbidden · 404 Not Found\n500 Server Error'
    },
    {
      front: 'CORS (Cross-Origin Resource Sharing) là gì và cách phòng tránh lỗi CORS?',
      back: 'Cơ chế browser chặn request chéo domain.\nFix: Thêm header Access-Control-Allow-Origin trên server.'
    }
  ];

  const existing = await db.query('SELECT id, front FROM flashcards WHERE deck_id = 21 ORDER BY id ASC');
  
  for (let i = 0; i < existing.rows.length; i++) {
    if (cards[i]) {
      await db.query('UPDATE flashcards SET back = $1 WHERE id = $2', [cards[i].back, existing.rows[i].id]);
    }
  }

  console.log('Done! Updated', existing.rows.length, 'cards with shorter answers.');
}

updateCards().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
