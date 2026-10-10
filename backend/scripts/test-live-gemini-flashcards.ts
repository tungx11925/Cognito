import dotenv from 'dotenv';
dotenv.config();

import { aiProviderService } from '../src/services/ai-provider.service';

async function testGeminiFlashcards() {
  console.log('=== TEST LIVE GEMINI 2.5 FLASH FLASHCARD GENERATION ===\n');

  // Tạo tài liệu mẫu > 8.000 ký tự (khoảng 8.500 ký tự)
  const topic = 'Kiến Trúc Máy Tính Và Mạng Máy Tính Nâng Cao';
  let sampleDoc = `# BÀI GIẢNG CHUYÊN SÂU: ${topic}\n\n`;

  const sections = [
    { title: '1. Cấu trúc Vi xử lý hiện đại (CPU Pipeline & Superscalar)', content: 'Bộ vi xử lý hiện đại sử dụng đường ống lệnh (Instruction Pipeline) để thực thi nhiều lệnh đồng thời. Các giai đoạn cơ bản gồm IF (Instruction Fetch), ID (Instruction Decode), EX (Execute), MEM (Memory Access), và WB (Write Back). Kỹ thuật Superscalar cho phép phát nhiều lệnh trong một chu kỳ xung nhịp (IPC > 1). Kỹ thuật phỏng đoán rẽ nhánh (Branch Prediction) kết hợp thực thi suy đoán (Speculative Execution) giúp tối ưu hóa hiệu suất nhưng làm phát sinh các lỗ hổng bảo mật như Spectre và Meltdown.' },
    { title: '2. Hệ thống phân tầng bộ nhớ (Memory Hierarchy & Cache Coherence)', content: 'Hệ thống bộ nhớ được tổ chức theo cấp bậc: Thanh ghi CPU, Cache L1 (Instruction và Data), Cache L2, Cache L3 dùng chung, RAM vật lý và Bộ nhớ ảo (Virtual Memory qua Paging/Swap). Giao thức MESI (Modified, Exclusive, Shared, Invalid) đảm bảo tính nhất quán dữ liệu bộ đệm (Cache Coherence) trong các hệ thống đa lõi đối xứng (SMP). Bảng trang (Page Table) và bộ đệm dịch địa chỉ (TLB - Translation Lookaside Buffer) hỗ trợ ánh xạ từ địa chỉ ảo sang địa chỉ vật lý nhanh chóng.' },
    { title: '3. Mô hình Mạng OSI và TCP/IP (Network Protocol Stack)', content: 'Mô hình OSI gồm 7 tầng: Vật lý, Liên kết dữ liệu, Mạng, Giao vận, Phiên, Trình diễn, Ứng dụng. Mô hình TCP/IP rút gọn thành 4 tầng: Network Interface, Internet, Transport, Application. Giao thức TCP cung cấp dịch vụ hướng kết nối tin cậy thông qua bắt tay 3 bước (SYN, SYN-ACK, ACK), kiểm soát lưu lượng (Sliding Window), và kiểm soát tắc nghẽn (Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery). Giao thức UDP là phi kết nối, tối ưu cho truyền phát thời gian thực.' },
    { title: '4. Định tuyến IP và Phân giải tên miền (Routing & DNS)', content: 'Giao thức BGP (Border Gateway Protocol) điều khiển định tuyến giữa các hệ thống tự trị (AS) trên Internet toàn cầu dựa trên đường đi (Path Vector). Trong mạng nội bộ, OSPF (Open Shortest Path First) sử dụng thuật toán Dijkstra để tính đường đi ngắn nhất. Hệ thống DNS (Domain Name System) chuyển đổi tên miền dạng người đọc sang địa chỉ IP thông qua kiến trúc phân cấp hình cây: Root Servers, TLD Servers, Authoritative Nameservers và Caching Resolvers.' },
    { title: '5. Mã hóa và Bảo mật mạng (Cryptography & TLS/SSL)', content: 'Mã hóa đối xứng (AES-GCM, ChaCha20) sử dụng chung một khóa bí mật cho cả mã hóa và giải mã, mang lại tốc độ cao. Mã hóa bất đối xứng (RSA, ECC, X25519) sử dụng cặp khóa công khai và khóa bí mật. Giao thức TLS 1.3 tinh giản quy trình bắt tay xuống chỉ còn 1 RTT (Round Trip Time) hoặc 0-RTT, bắt buộc sử dụng Perfect Forward Secrecy (PFS) bằng thuật toán trao đổi khóa Diffie-Hellman tạm thời (ECDHE).' },
  ];

  // Nhân bản nội dung để tài liệu vượt quá 8.500 ký tự
  while (sampleDoc.length < 8800) {
    for (const sec of sections) {
      sampleDoc += `\n### ${sec.title}\n${sec.content}\nPhân tích chi tiết: Khái niệm này đóng vai trò then chốt trong hạ tầng tính toán phân tán hiện đại. Kỹ sư hệ thống cần nắm vững cơ chế hoạt động, các thông số băng thông, độ trễ và các kịch bản chịu tải cao để thiết kế giải pháp tin cậy.\n`;
    }
  }

  console.log(`Độ dài tài liệu kiểm thử: ${sampleDoc.length} ký tự (vượt ngưỡng AI_LONG_DOC_CHAR_THRESHOLD = ${process.env.AI_LONG_DOC_CHAR_THRESHOLD || 8000})`);

  const systemPrompt = `Bạn là chuyên gia sư phạm. Hãy trích xuất các khái niệm quan trọng nhất từ tài liệu sau và tạo thành các flashcard (thẻ ghi nhớ).
YÊU CẦU BẮT BUỘC:
- Trả về DUY NHẤT một mảng JSON thuần túy (JSON array).
- Mỗi phần tử có đúng 2 trường: "front" (câu hỏi/khái niệm) và "back" (đáp án/giải thích súc tích).
- Số lượng thẻ: sinh từ 10 đến 25 thẻ.
- Không thêm bất kỳ văn bản giải thích nào ngoài JSON.`;

  console.log('\nĐang gọi AI Provider Service (kỳ vọng: tự động ưu tiên Gemini 2.5 Flash vì doc > 8.000 ký tự)...');

  const startTime = Date.now();
  const res = await aiProviderService.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sampleDoc }
    ],
    taskType: 'flashcard',
    jsonMode: true,
    temperature: 0.3,
  });
  const durationMs = Date.now() - startTime;

  console.log(`\n================ KẾT QUẢ GỌI AI THẬT ================`);
  console.log(`Provider sử dụng : ${res.provider.toUpperCase()}`);
  console.log(`Model sử dụng    : ${res.modelName}`);
  console.log(`Thời gian phản hồi: ${durationMs} ms (${(durationMs / 1000).toFixed(2)}s)`);
  console.log(`Input Tokens     : ${res.inputTokens ?? 'N/A'}`);
  console.log(`Output Tokens    : ${res.outputTokens ?? 'N/A'}`);
  console.log(`Chi phí ước tính : $${res.estimatedCost ?? 0}`);

  let cleaned = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  const cards = JSON.parse(cleaned);

  console.log(`Số thẻ tạo ra    : ${cards.length} thẻ`);
  console.log(`\nMẫu 3 thẻ đầu tiên:`);
  cards.slice(0, 3).forEach((c: any, i: number) => {
    console.log(`  [Thẻ ${i + 1}]`);
    console.log(`    - Mặt trước: ${c.front}`);
    console.log(`    - Mặt sau  : ${c.back}`);
  });

  if (res.provider !== 'gemini') {
    throw new Error(`Kỳ vọng provider là 'gemini' nhưng thực tế là '${res.provider}'`);
  }
  if (!res.modelName.includes('gemini-2.5-flash')) {
    throw new Error(`Kỳ vọng model là 'gemini-2.5-flash' nhưng thực tế là '${res.modelName}'`);
  }
  if (!Array.isArray(cards) || cards.length < 5) {
    throw new Error(`Số lượng thẻ sinh ra không hợp lệ: ${cards.length}`);
  }

  console.log('\n🎉 TEST GEMINI 2.5 FLASH FLASHCARD GENERATION HOÀN TOÀN THÀNH CÔNG!');
}

testGeminiFlashcards()
  .then(() => {
    setTimeout(() => process.exit(0), 200);
  })
  .catch(err => {
    console.error('\n❌ TEST THẤT BẠI:', err);
    process.exit(1);
  });
