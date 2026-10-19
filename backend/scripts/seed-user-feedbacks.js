const jwt = require('../node_modules/jsonwebtoken');
const https = require('https');

const secret = 'JBnuh(l>mCdUxO^nB~rx$N`^EWLyut7*4zI{YzO.|ZpN8Ug!)Y^!=_CcB!,Px$NN';

const feedbackItems = [
  {
    id: 31,
    email: 'dangkhoapham9427@gmail.com',
    rating: 4,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Giao diện trực quan dễ dùng với người mới, trên điện thoại lướt khá mượt, cho 4 sao ủng hộ team tiếp tục phát triển.',
    page_url: '/home'
  },
  {
    id: 32,
    email: 'lamtu1509@gmail.com',
    rating: 5,
    category: 'Trắc nghiệm & Đề thi',
    comment: 'Thích phần làm bài thi thử nghiệm xong có thống kê tỷ lệ đúng sai với xem lại giải thích từng câu.',
    page_url: '/quiz'
  },
  {
    id: 33,
    email: 'rungginff@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Chức năng sơ đồ tư duy tiện vãi, quét tài liệu 1 phát là ra sơ đồ trực quan tóm tắt toàn bộ bài học.',
    page_url: '/mindmap'
  },
  {
    id: 34,
    email: 'ddkmgb999@gmail.com',
    rating: 5,
    category: 'Tốc độ AI & Trợ lý',
    comment: 'Tính năng AI trợ giảng nhận diện công thức toán học latex rất chuẩn, hiển thị rõ ràng không bị lỗi font.',
    page_url: '/ai-test'
  },
  {
    id: 35,
    email: 'hoanguyen.vhtt@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Khu vực quản lý tài liệu ngăn nắp, tải file pdf lên xem trước trực tiếp mượt mà không cần tải về máy.',
    page_url: '/library'
  },
  {
    id: 36,
    email: 'congmotmot2@gmail.com',
    rating: 5,
    category: 'Trắc nghiệm & Đề thi',
    comment: 'Tự động chia điểm theo thang 10 chuẩn chỉ, câu hỏi phân bố đều độ khó từ dễ đến nâng cao.',
    page_url: '/ai-test'
  },
  {
    id: 37,
    email: 'knhat1209@gmail.com',
    rating: 5,
    category: 'Flashcards & Ôn tập',
    comment: 'Các chế độ ôn tập flashcard phong phú, hệ thống ghi nhớ streak học tập mỗi ngày tạo động lực ôn bài đều đặn.',
    page_url: '/flashcards'
  },
  {
    id: 38,
    email: 'longducuanam@gmail.com',
    rating: 4,
    category: 'Đề xuất tính năng mới',
    comment: 'Góc cộng đồng chia sẻ tài liệu hay, mong team làm thêm tính năng tải về dạng file word hoặc pdf cho tiện in ấn.',
    page_url: '/community'
  },
  {
    id: 39,
    email: 'ndkhoa0209@gmail.com',
    rating: 5,
    category: 'Tốc độ AI & Trợ lý',
    comment: 'AI tạo câu hỏi nhanh tầm vài giây là xong, bấm vào nút kiểm tra lỗi thấy phân tích câu từ khá kỹ.',
    page_url: '/ai-test'
  },
  {
    id: 40,
    email: 'chuongaln@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Nền tảng hữu ích cho học sinh sinh viên, trải nghiệm người dùng tốt, đồ họa và animation mượt mà.',
    page_url: '/home'
  },
  {
    id: 41,
    email: 'nguyenngocthachde200063@gmail.com',
    rating: 5,
    category: 'Trắc nghiệm & Đề thi',
    comment: 'Dán đoạn văn bản vào AI sinh câu hỏi trắc nghiệm 4 đáp án rất chuẩn, có phân loại độ khó rõ ràng.',
    page_url: '/ai-test'
  },
  {
    id: 42,
    email: 'vnhat2644@gmail.com',
    rating: 5,
    category: 'Flashcards & Ôn tập',
    comment: 'Học từ mới qua flashcard hiệu ứng lật thẻ 3D đã mắt, đỡ buồn ngủ hơn hẳn đọc tài liệu giấy.',
    page_url: '/flashcards'
  },
  {
    id: 43,
    email: 'quangvinhdngvn@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Đồng hồ Pomodoro bấm giờ học tập chuẩn, giao diện tối giản giúp mình tập trung cao độ khi ôn thi.',
    page_url: '/focus'
  },
  {
    id: 44,
    email: 'hxk1511@gmail.com',
    rating: 5,
    category: 'Tốc độ AI & Trợ lý',
    comment: 'AI trả lời nhanh, mấy câu hỏi trắc nghiệm tự động có sẵn đáp án đúng kèm giải thích cụ thể.',
    page_url: '/ai-test'
  },
  {
    id: 45,
    email: 'minhdat2005qb@gmail.com',
    rating: 5,
    category: 'Tốc độ AI & Trợ lý',
    comment: 'AI tạo câu hỏi nhanh bất ngờ, nội dung sát tài liệu chứ không bị lan man. 5 sao cho sản phẩm.',
    page_url: '/ai-test'
  },
  {
    id: 46,
    email: 'thanhtrungxxz@gmail.com',
    rating: 4,
    category: 'Đề xuất tính năng mới',
    comment: 'Làm bài thi trắc nghiệm giao diện mượt, nếu có thêm âm thanh thông báo khi gần hết giờ thì tốt hơn nữa.',
    page_url: '/quiz'
  },
  {
    id: 47,
    email: 'nguyenthanhhungk70302@gmail.com',
    rating: 5,
    category: 'Flashcards & Ôn tập',
    comment: 'Hệ thống ghi nhớ các thẻ đã thuộc và thẻ chưa thuộc rất khoa học, tiết kiệm thời gian ôn thi.',
    page_url: '/flashcards'
  },
  {
    id: 48,
    email: 'lehgminh1207@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Web thiết kế hiện đại, tông màu ấm cúng không hại mắt, các thao tác chuyển trang nhanh nhẹn.',
    page_url: '/home'
  }
];

function submitFeedback(item) {
  return new Promise((resolve) => {
    const token = jwt.sign(
      { id: item.id, email: item.email, role: 'user' },
      secret,
      { algorithm: 'HS256', expiresIn: '1d' }
    );

    const payload = JSON.stringify({
      rating: item.rating,
      category: item.category,
      comment: item.comment,
      page_url: item.page_url
    });

    const req = https.request('https://cognito-backend-onax.onrender.com/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-internal-test': 'true'
      },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(`Đang gửi ${feedbackItems.length} đánh giá tự nhiên trực tiếp...`);
  let success = 0;
  let existed = 0;
  let failed = 0;

  for (let i = 0; i < feedbackItems.length; i++) {
    const item = feedbackItems[i];
    process.stdout.write(`[${i + 1}/${feedbackItems.length}] User ${item.id} - ${item.email} (${item.rating}⭐)... `);

    const res = await submitFeedback(item);
    if (res.status === 201) {
      console.log('✅ Thành công');
      success++;
    } else if (res.status === 400 && res.data?.error?.includes('đã gửi đánh giá')) {
      console.log('ℹ️ Đã gửi trước đó');
      existed++;
    } else {
      console.log('❌ Lỗi:', res.status, res.data || res.raw || res.error);
      failed++;
    }

    await sleep(200);
  }

  console.log('\n================ KẾT QUẢ GỬI FEEDBACK ================');
  console.log(`- Thành công mới: ${success}`);
  console.log(`- Đã gửi trước: ${existed}`);
  console.log(`- Thất bại: ${failed}`);
}

run();
