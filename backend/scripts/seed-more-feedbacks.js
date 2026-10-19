const jwt = require('../node_modules/jsonwebtoken');
const https = require('https');

const secret = 'JBnuh(l>mCdUxO^nB~rx$N`^EWLyut7*4zI{YzO.|ZpN8Ug!)Y^!=_CcB!,Px$NN';

const feedbackBatch = [
  {
    id: 27,
    email: 'giantich520@gmail.com',
    rating: 5,
    category: 'Flashcards & Ôn tập',
    comment: 'Bộ flashcard học từ vựng IELTS có phát âm với lật thẻ 3D xịn sò, dùng trên ipad lướt mượt mà không bị giật lag.',
    page_url: '/flashcards'
  },
  {
    id: 20,
    email: 'ngoquangtrai1903@gmail.com',
    rating: 4,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Tone màu be của web nhìn rất êm mắt, nhất là lúc thức khuya cày bài. Nếu có thêm phím tắt lật thẻ flashcard bằng bàn phím nữa thì 10/10.',
    page_url: '/home'
  },
  {
    id: 19,
    email: 'nguyenxuanhuan.dev@gmail.com',
    rating: 5,
    category: 'Tốc độ AI & Trợ lý',
    comment: 'AI phân tích tài liệu và xuất sơ đồ tư duy cực nhanh, cấu trúc phân nhánh logic giúp mình nắm nhanh ý chính của cả chương.',
    page_url: '/mindmap'
  },
  {
    id: 17,
    email: 'minhanh05@gmail.com',
    rating: 5,
    category: 'Trắc nghiệm & Đề thi',
    comment: 'Vừa thi thử xong, hệ thống chấm điểm theo thang 10 có giải thích chi tiết vì sao sai. Đỡ phải đi hỏi bài lung tung.',
    page_url: '/quiz'
  },
  {
    id: 16,
    email: 'vmkiet2808@gmail.com',
    rating: 4,
    category: 'Đề xuất tính năng mới',
    comment: 'Đồng hồ Pomodoro kết hợp học rất tập trung. Mong admin thêm tùy chọn chỉnh thời gian nghỉ 10 phút thay vì cố định 5 phút.',
    page_url: '/focus'
  },
  {
    id: 15,
    email: 'nhatminhnguyen236@gmail.com',
    rating: 5,
    category: 'Tốc độ AI & Trợ lý',
    comment: 'Mấy công thức toán tích phân với ma trận render KaTeX rất mượt, không bị vỡ hay lỗi ký tự như mấy trang khác.',
    page_url: '/ai-test'
  },
  {
    id: 14,
    email: 'pronumbergemini@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Web load nhanh, các nút bấm bố trí hợp lý. Thích nhất phần thư viện lưu trữ tài liệu cá nhân, sắp xếp rất ngăn nắp.',
    page_url: '/library'
  },
  {
    id: 13,
    email: 'minhtai130tgm@gmail.com',
    rating: 5,
    category: 'Flashcards & Ôn tập',
    comment: 'Tính năng tự động chuyển file bài giảng thành bộ thẻ ôn tập thông minh đỉnh chóp, tuần trước mình vừa qua môn Triết nhờ web này.',
    page_url: '/flashcards'
  },
  {
    id: 11,
    email: 'naaotaku696@gmail.com',
    rating: 5,
    category: 'Giao diện & Trải nghiệm',
    comment: 'Trải nghiệm mượt mà, giao diện phong cách tối giản nhìn rất có gu, học bài cả buổi không thấy mỏi mắt.',
    page_url: '/home'
  },
  {
    id: 10,
    email: 'trisude998@gmail.com',
    rating: 4,
    category: 'Đề xuất tính năng mới',
    comment: 'Làm trắc nghiệm xong xuất kết quả ra file để lưu lại rất tiện, mong sắp tới có thêm bảng xếp hạng bạn bè cùng phòng học.',
    page_url: '/quiz'
  },
  {
    id: 7,
    email: 'vuhailam05@gmail.com',
    rating: 5,
    category: 'Trắc nghiệm & Đề thi',
    comment: 'Bộ câu hỏi AI sinh ra phân hóa tốt, có cả câu hỏi nhận biết lẫn vận dụng cao. Rất phù hợp cho sinh viên tự học.',
    page_url: '/ai-test'
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
  console.log(`Đang gửi ${feedbackBatch.length} đánh giá bổ sung...`);
  let success = 0;
  let existed = 0;
  let failed = 0;

  for (let i = 0; i < feedbackBatch.length; i++) {
    const item = feedbackBatch[i];
    process.stdout.write(`[${i + 1}/${feedbackBatch.length}] User ${item.id} - ${item.email} (${item.rating}⭐)... `);

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

    await sleep(300);
  }

  console.log('\n================ KẾT QUẢ GỬI FEEDBACK BỔ SUNG ================');
  console.log(`- Thành công mới: ${success}`);
  console.log(`- Đã gửi trước: ${existed}`);
  console.log(`- Thất bại: ${failed}`);
}

run();
