const { db } = require('../dist/db');

async function seedCleanDeck() {
  const cards = [
    {
      front: 'REST API là gì và các phương thức HTTP phổ biến nhất?',
      back: 'REST API là chuẩn kiến trúc web giao tiếp qua HTTP không lưu trạng thái (Stateless).\nCác phương thức chính: GET (đọc dữ liệu), POST (tạo mới), PUT (cập nhật toàn bộ), PATCH (cập nhật một phần), DELETE (xóa dữ liệu).'
    },
    {
      front: 'Khác biệt cơ bản giữa Cơ sở dữ liệu SQL và NoSQL là gì?',
      back: '- SQL (Relational): Dữ liệu dạng bảng có schema cố định, quan hệ chặt chẽ, hỗ trợ ACID giao dịch cao (ví dụ: PostgreSQL, MySQL).\n- NoSQL (Non-relational): Dữ liệu phi quan hệ (Document, Key-Value, Graph), schema linh hoạt, dễ mở rộng quy mô ngang (ví dụ: MongoDB, Redis).'
    },
    {
      front: 'Nguyên lý ACID trong hệ quản trị cơ sở dữ liệu gồm những gì?',
      back: '- A (Atomicity - Nguyên tử): Giao dịch hoàn thành trọn vẹn hoặc rollback hoàn toàn.\n- C (Consistency - Nhất quán): Dữ liệu luôn tuân thủ toàn vẹn ràng buộc.\n- I (Isolation - Cô lập): Các giao dịch chạy đồng thời không ảnh hưởng nhau.\n- D (Durability - Bền vững): Dữ liệu đã commit sẽ lưu vĩnh viễn dù hệ thống gặp sự cố.'
    },
    {
      front: 'JWT (JSON Web Token) hoạt động như thế nào trong xác thực người dùng?',
      back: 'JWT gồm 3 phần: Header (loại token & thuật toán), Payload (thông tin user/claims) và Signature (chữ ký số bí mật xác minh tính toàn vẹn).\nServer không cần lưu session, chỉ cần giải mã và verify chữ ký token do client gửi qua header Authorization (Bearer).'
    },
    {
      front: 'Docker và Containerization giải quyết vấn đề gì trong phát triển phần mềm?',
      back: 'Docker đóng gói ứng dụng cùng mọi dependencies, cấu hình và runtime vào một Container độc lập, gọn nhẹ.\nGiúp loại bỏ hoàn toàn lỗi "Works on my machine" (chạy được trên máy dev nhưng lỗi trên server) và tiết kiệm tài nguyên hơn máy ảo (VM).'
    },
    {
      front: 'CI/CD (Continuous Integration / Continuous Deployment) là gì?',
      back: '- CI (Tích hợp liên tục): Tự động build, kiểm tra cú pháp và chạy test tự động mỗi khi dev push code mới.\n- CD (Triển khai liên tục): Tự động release và deploy sản phẩm lên staging/production an toàn và nhanh chóng khi vượt qua toàn bộ bài test.'
    },
    {
      front: '4 tính chất cốt lõi của Lập trình Hướng Đối Tượng (OOP) là gì?',
      back: '1. Encapsulation (Đóng gói): Giấu dữ liệu nội bộ qua private/protected, chỉ mở public interface.\n2. Inheritance (Kế thừa): Class con kế thừa thuộc tính và phương thức từ class cha.\n3. Polymorphism (Đa hình): Các đối tượng khác nhau thực thi cùng một phương thức theo cách riêng.\n4. Abstraction (Trừu tượng): Ẩn đi sự phức tạp cài đặt, chỉ thể hiện hành vi qua interface/abstract class.'
    },
    {
      front: 'Event Loop trong JavaScript hoạt động như thế nào?',
      back: 'JavaScript chạy đơn luồng (Single-thread). Event Loop liên tục kiểm tra Call Stack: khi Call Stack trống, nó sẽ lấy các tác vụ từ Microtask Queue (Promise, async/await) trước, sau đó đến Macrotask Queue (setTimeout, setInterval, I/O) để đưa vào Call Stack thực thi.'
    },
    {
      front: 'Closure trong JavaScript là gì và ứng dụng thực tế?',
      back: 'Closure là hàm có khả năng ghi nhớ và truy cập vào các biến thuộc phạm vi cha (lexical scope) ngay cả khi hàm cha đã kết thúc thực thi.\nỨng dụng: Tạo biến private (dữ liệu đóng gói), module pattern, currying và tối ưu bộ nhớ đệm cache (memoization).'
    },
    {
      front: 'Kiến trúc Microservices khác Monolith như thế nào?',
      back: '- Monolith: Toàn bộ hệ thống (UI, Business Logic, DB) đóng gói chung trong 1 codebase và deploy cùng 1 khối duy nhất.\n- Microservices: Chia nhỏ hệ thống thành các service độc lập theo từng nghiệp vụ, có DB riêng, giao tiếp qua HTTP/gRPC/Message Queue và deploy độc lập.'
    },
    {
      front: 'Caching (Bộ nhớ đệm) với Redis mang lại lợi ích gì?',
      back: 'Redis lưu trữ dữ liệu dạng key-value trực tiếp trên bộ nhớ RAM, cho tốc độ truy xuất cực nhanh (< 1ms).\nCaching giúp giảm tải trực tiếp cho Database chính, giảm độ trễ (latency) của API và chịu tải lượng truy cập tăng đột biến.'
    },
    {
      front: 'Git Rebase khác Git Merge như thế nào?',
      back: '- Git Merge: Giữ nguyên lịch sử các commit nhánh tính năng và tạo 1 merge commit nối trên nhánh chính.\n- Git Rebase: Viết lại lịch sử bằng cách chuyển toàn bộ commit của nhánh tính năng đặt lên đỉnh của nhánh đích, tạo lịch sử commit thẳng hàng và sạch sẽ.'
    },
    {
      front: 'Mã trạng thái HTTP Status Code phổ biến (200, 201, 400, 401, 403, 404, 500) biểu thị điều gì?',
      back: '- 200 OK: Thành công\n- 201 Created: Tạo tài nguyên mới thành công\n- 400 Bad Request: Dữ liệu gửi lên không hợp lệ\n- 401 Unauthorized: Chưa xác thực danh tính (chưa đăng nhập)\n- 403 Forbidden: Không có quyền truy cập tài nguyên\n- 404 Not Found: Không tìm thấy tài nguyên\n- 500 Internal Server Error: Lỗi xử lý phía Server'
    },
    {
      front: 'CORS (Cross-Origin Resource Sharing) là gì và cách phòng tránh lỗi CORS?',
      back: 'CORS là cơ chế bảo mật trên trình duyệt chặn web app ở một domain/origin gọi API tới domain khác nếu server không cho phép.\nCách khắc phục: Cấu hình Backend trả về các HTTP Headers thích hợp như Access-Control-Allow-Origin, Access-Control-Allow-Methods, và xử lý OPTIONS preflight request.'
    }
  ];

  console.log('Seeding 1 single IT deck with 14 cards for demo...');

  // 1. Delete other decks for user 2 so user 2 has ONLY 1 single deck for clean demo
  await db.query('DELETE FROM flashcards WHERE deck_id IN (SELECT id FROM flashcard_decks WHERE user_id = 2 AND id != 21)');
  await db.query('DELETE FROM flashcard_decks WHERE user_id = 2 AND id != 21');

  // 2. Ensure Deck 21 exists
  let deckRes = await db.query('SELECT id FROM flashcard_decks WHERE id = 21');
  if (deckRes.rows.length === 0) {
    deckRes = await db.query(`
      INSERT INTO flashcard_decks (id, user_id, name, description, is_public)
      VALUES (21, 2, 'Kiến thức Nền tảng CNTT & Phần mềm', 'Bộ 14 thẻ ôn tập kiến thức cốt lõi Công nghệ Thông tin, Web Architecture & Hệ thống', false)
      RETURNING id
    `);
  } else {
    await db.query(`
      UPDATE flashcard_decks
      SET name = 'Kiến thức Nền tảng CNTT & Phần mềm',
          description = 'Bộ 14 thẻ ôn tập kiến thức cốt lõi Công nghệ Thông tin, Web Architecture & Hệ thống'
      WHERE id = 21
    `);
  }

  // 3. Clear old cards in deck 21
  await db.query('DELETE FROM flashcards WHERE deck_id = 21');

  // 4. Insert 14 cards
  for (const c of cards) {
    await db.query(
      'INSERT INTO flashcards (deck_id, document_id, front, back, ease_factor, repetitions, interval_days) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [21, null, c.front, c.back, 2.5, 0, 0]
    );
  }

  const check = await db.query('SELECT COUNT(*) as count FROM flashcards WHERE deck_id = 21');
  console.log('SUCCESS! Seeded deck 21 with', check.rows[0].count, 'cards');
  const userDecks = await db.query('SELECT id, name, (SELECT COUNT(*) FROM flashcards WHERE deck_id = d.id) as card_count FROM flashcard_decks d WHERE user_id = 2');
  console.log('USER 2 DECKS NOW:', userDecks.rows);
}

seedCleanDeck()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
