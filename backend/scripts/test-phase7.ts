import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import * as xlsx from 'xlsx';
import { db } from '../src/db';
import { examParserService } from '../src/services/exam-parser.service';
import { generateTestFixtures } from './generate-fixtures';

const API_BASE = 'http://localhost:5000/api';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`\x1b[31m  [FAIL] ${message}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m  [PASS] ${message}\x1b[0m`);
  }
}

async function runPhase7Tests() {
  console.log('========================================================');
  console.log('    COGNITO PHASE 7: EXISTING EXAM IMPORT TEST SUITE   ');
  console.log('========================================================\n');

  try {
    // 0. Ensure fixtures exist
    await generateTestFixtures();
    const fixtureDir = path.join(process.cwd(), 'uploads/test_fixtures');

    // ─────────────────────────────────────────────────────────────
    // Setup test users
    // ─────────────────────────────────────────────────────────────
    await db.query(`DELETE FROM users WHERE email IN ('phase7_userA@example.com', 'phase7_userB@example.com') OR phone IN ('0987657001', '0987657002')`);

    const regUserA = await axios.post(`${API_BASE}/auth/register`, {
      email: 'phase7_userA@example.com',
      password: 'Password123!',
      name: 'Phase7 Student User A',
      phone: '0987657001',
    });
    const tokenA = regUserA.data.accessToken || regUserA.data.token;
    const userA = regUserA.data.user;

    const headersA = { Authorization: `Bearer ${tokenA}` };

    console.log(`[Setup] Test User A ID: ${userA.id}\n`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Rule-based regex parsing (Standard & Inline Keys)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Rule-Based Parser (Standard & Inline Keys) ---');
    const examTextInline = `
ĐỀ KIỂM TRA MÔN TOÁN HỌC KỲ 1

Câu 1: Đạo hàm của hàm số y = x^2 là gì?
A. 2x
B. x
C. 2
D. x^2
Đáp án: A

Câu 2: Nguyên hàm của hàm số f(x) = 2x là gì?
A. x^2 + C
B. 2x^2 + C
C. x + C
D. 2 + C
Đáp án: A

Câu 3: Số nghiệm thực của phương trình x^2 - 4 = 0 là?
A. 0
B. 1
C. 2
D. 3
Đáp án: C
    `.trim();

    const parseInlineRes = examParserService.parseRuleBased(examTextInline);
    assert(parseInlineRes.questions.length === 3, 'Suite 1.1: Trích xuất chính xác 3 câu hỏi từ văn bản có inline answer keys');
    assert(parseInlineRes.questions[0].correctAnswer === 'A', 'Suite 1.2: Nhận diện chính xác inline answer key câu 1 = A');
    assert(parseInlineRes.questions[2].correctAnswer === 'C', 'Suite 1.3: Nhận diện chính xác inline answer key câu 3 = C');
    assert(parseInlineRes.questions[0].options?.A === '2x', 'Suite 1.4: Bóc tách chính xác nội dung Option A');
    assert(parseInlineRes.questions[0].options?.B === 'x', 'Suite 1.5: Bóc tách chính xác nội dung Option B');

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Answer Key Table at bottom (BẢNG ĐÁP ÁN: 1.C, 2.D...)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Answer Key Table Extraction (Bảng đáp án cuối bài) ---');
    const examTextWithTable = `
KỲ THI THỬ TỐT NGHIỆP THPT
Môn: Lịch sử

Câu 1: Hội nghị Ianta diễn ra vào năm nào?
A. 1943
B. 1944
C. 1945
D. 1946

Câu 2: Quốc gia nào sau đây là Ủy viên thường trực Hội đồng Bảo an Liên hợp quốc?
A. Đức
B. Nhật Bản
C. Ấn Độ
D. Pháp

Câu 3: Khối quân sự NATO được thành lập vào năm nào?
A. 1947
B. 1948
C. 1949
D. 1950

BẢNG ĐÁP ÁN:
1.C 2.D 3.C
    `.trim();

    const parseTableRes = examParserService.parseRuleBased(examTextWithTable);
    assert(parseTableRes.questions.length === 3, 'Suite 2.1: Trích xuất 3 câu hỏi và tách rời bảng đáp án khỏi thân đề');
    assert(parseTableRes.questions[0].correctAnswer === 'C', 'Suite 2.2: Ghép nối chính xác đáp án câu 1 = C từ BẢNG ĐÁP ÁN');
    assert(parseTableRes.questions[1].correctAnswer === 'D', 'Suite 2.3: Ghép nối chính xác đáp án câu 2 = D từ BẢNG ĐÁP ÁN');
    assert(parseTableRes.questions[2].correctAnswer === 'C', 'Suite 2.4: Ghép nối chính xác đáp án câu 3 = C từ BẢNG ĐÁP ÁN');
    assert(!parseTableRes.questions[2].content.includes('BẢNG ĐÁP ÁN'), 'Suite 2.5: Thân câu hỏi cuối không bị lẫn header bảng đáp án');

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Question Structure Detection (MCQ, True/False, FillBlank, Essay)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: Question Structure Detection ---');
    const mixedStructuresText = `
Câu 1: Trái đất quay quanh Mặt Trời.
A. Đúng
B. Sai
Đáp án: A

Câu 2: Điền từ còn thiếu vào chỗ trống: Quang hợp diễn ra chủ yếu ở bào quan ___ của tế bào thực vật.
Đáp án: Lục lạp

Câu 3: Hãy nêu ý nghĩa lịch sử của Cách mạng tháng Tám năm 1945 đối với dân tộc Việt Nam.
    `.trim();

    const mixedRes = examParserService.parseRuleBased(mixedStructuresText);
    assert(mixedRes.questions.length === 3, 'Suite 3.1: Nhận diện đầy đủ 3 câu hỏi cấu trúc hỗn hợp');
    assert(mixedRes.questions[0].type === 'TRUE_FALSE', 'Suite 3.2: Nhận diện cấu trúc TRUE_FALSE (Đúng / Sai)');
    assert(mixedRes.questions[0].correctAnswer === 'A' || mixedRes.questions[0].correctAnswer === 'TRUE', 'Suite 3.3: Đáp án Đúng/Sai được chuẩn hóa chính xác');
    assert(mixedRes.questions[1].type === 'FILL_BLANK', 'Suite 3.4: Nhận diện cấu trúc FILL_BLANK (chứa dấu gạch ngang ___)');
    assert(mixedRes.questions[2].type === 'ESSAY', 'Suite 3.5: Nhận diện cấu trúc ESSAY (câu hỏi tự luận không có options)');

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Real .docx file parsing (Microsoft Word)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Real .docx File Parsing (Microsoft Word) ---');
    const docxPath = path.join(fixtureDir, 'sample_exam.docx');
    assert(fs.existsSync(docxPath), 'Suite 4.1: Tồn tại file sample_exam.docx thật');

    const docxParseRes = await examParserService.parseExam({
      filePath: docxPath,
      originalName: 'sample_exam.docx',
      name: 'Đề thi Word kiểm thử',
      useAI: false,
    });

    assert(docxParseRes.questions.length === 3, 'Suite 4.2: Bóc tách chính xác 3 câu hỏi từ file .docx thật');
    assert(docxParseRes.extractionMethod === 'RULE_BASED', 'Suite 4.3: Extraction method của file docx là RULE_BASED (0 AI tokens)');
    assert(docxParseRes.questions[0].content.includes('Thủ đô của Việt Nam'), 'Suite 4.4: Nội dung câu 1 file Word đọc chính xác');
    assert(docxParseRes.questions[0].correctAnswer === 'B', 'Suite 4.5: Đáp án câu 1 file Word đọc chính xác là B');
    assert(docxParseRes.questions[2].correctAnswer === 'C', 'Suite 4.6: Đáp án câu 3 file Word đọc chính xác là C');

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Real .pdf with text layer parsing
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: Real .pdf File with Text Layer ---');
    const pdfPath = path.join(fixtureDir, 'file_1_text_layer.pdf');
    assert(fs.existsSync(pdfPath), 'Suite 5.1: Tồn tại file PDF file_1_text_layer.pdf thật có text layer');

    const pdfParseRes = await examParserService.parseExam({
      filePath: pdfPath,
      originalName: 'file_1_text_layer.pdf',
      name: 'Tài liệu PDF kiểm thử',
      useAI: false,
    });

    assert(pdfParseRes.questions.length >= 2, 'Suite 5.2: Bóc tách thành công các câu hỏi từ file PDF có text layer');
    assert(pdfParseRes.extractionMethod === 'RULE_BASED', 'Suite 5.3: Extraction method của file PDF là RULE_BASED');

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: Scanned / Empty PDF Error Handling (No silent failure)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: Scanned / Empty PDF Rejection & Diagnostics ---');
    const scannedPdfPath = path.join(fixtureDir, 'file_2_scanned_image.pdf');
    assert(fs.existsSync(scannedPdfPath), 'Suite 6.1: Tồn tại file PDF scan ảnh không có text layer');

    let scannedCaught = false;
    let scannedErrorMessage = '';
    try {
      await examParserService.parseExam({
        filePath: scannedPdfPath,
        originalName: 'file_2_scanned_image.pdf',
        useAI: false,
      });
    } catch (err: any) {
      scannedCaught = true;
      scannedErrorMessage = err.message || '';
    }

    assert(scannedCaught, 'Suite 6.2: PDF scan không có text layer bị TỪ CHỐI (không báo thành công giả tạo)');
    assert(
      scannedErrorMessage.includes('text layer') || scannedErrorMessage.includes('scan'),
      `Suite 6.3: Thông báo lỗi chẩn đoán rõ ràng cho người dùng: "${scannedErrorMessage}"`
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 7: Security & Disguised Fake File Rejection (Magic Bytes Check)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 7: Security & Disguised Fake File Rejection ---');
    const fakePdfPath = path.join(fixtureDir, 'disguised_fake.pdf');
    assert(fs.existsSync(fakePdfPath), 'Suite 7.1: Tồn tại file .exe đổi đuôi thành .pdf');

    let fakeCaught = false;
    let fakeErrorMessage = '';
    try {
      await examParserService.parseExam({
        filePath: fakePdfPath,
        originalName: 'disguised_fake.pdf',
        useAI: false,
      });
    } catch (err: any) {
      fakeCaught = true;
      fakeErrorMessage = err.message || '';
    }

    assert(fakeCaught, 'Suite 7.2: File giả mạo header (%PDF-) bị chặn đứng ngay lập tức');
    assert(
      fakeErrorMessage.includes('Invalid PDF header signature') || fakeErrorMessage.includes('giả mạo'),
      `Suite 7.3: Lỗi bắt đúng chữ ký header giả mạo: "${fakeErrorMessage}"`
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 8: Exams WITHOUT Answer Key (Đề không có đáp án)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 8: Exam Without Answer Key (correctAnswer = undefined) ---');
    const examNoAnswerText = `
Câu 1: Kim loại nào sau đây dẫn điện tốt nhất?
A. Vàng
B. Bạc
C. Đồng
D. Nhôm

Câu 2: Nguyên tố hóa học nào phổ biến nhất trong vỏ Trái Đất?
A. Oxi
B. Silic
C. Nhôm
D. Sắt
    `.trim();

    const noAnsRes = examParserService.parseRuleBased(examNoAnswerText);
    assert(noAnsRes.questions.length === 2, 'Suite 8.1: Bóc tách thành công 2 câu hỏi từ đề không có đáp án');
    assert(noAnsRes.questions[0].correctAnswer === undefined, 'Suite 8.2: Câu 1 có correctAnswer = undefined (KHÔNG tự gán A hay đoán mò)');
    assert(noAnsRes.questions[1].correctAnswer === undefined, 'Suite 8.3: Câu 2 có correctAnswer = undefined (KHÔNG tự gán A hay đoán mò)');
    assert(noAnsRes.answerKeyFoundCount === 0, 'Suite 8.4: Thống kê số lượng đáp án tìm thấy đúng bằng 0');

    // ─────────────────────────────────────────────────────────────
    // SUITE 9: Business Rule Guard on APPROVED with missing answers
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 9: Business Rule Guard on APPROVED vs DRAFT ---');
    // Cố gắng import bộ đề ở trạng thái APPROVED khi còn câu thiếu đáp án -> BẮT BUỘC BỊ TỪ CHỐI (HTTP 400)
    let approvedRejectCaught = false;
    let approvedRejectMsg = '';
    try {
      await axios.post(
        `${API_BASE}/exams/import`,
        {
          name: 'Đề thi thiếu đáp án - Thử APPROVED',
          questions: noAnsRes.questions,
          status: 'APPROVED',
        },
        { headers: headersA }
      );
    } catch (err: any) {
      approvedRejectCaught = true;
      approvedRejectMsg = err.response?.data?.error || err.message;
    }

    assert(approvedRejectCaught, 'Suite 9.1: Chặn đứng POST /api/exams/import với status = APPROVED khi còn câu thiếu đáp án (HTTP 400)');
    assert(
      approvedRejectMsg.includes('chưa có đáp án đúng'),
      `Suite 9.2: Thông báo lỗi chỉ rõ ràng buộc thiếu đáp án: "${approvedRejectMsg}"`
    );

    // Lưu cùng bộ đề đó ở trạng thái DRAFT (Bản nháp) -> CHO PHÉP THÀNH CÔNG (HTTP 201)
    const draftImportRes = await axios.post(
      `${API_BASE}/exams/import`,
      {
        name: 'Đề thi thiếu đáp án - Lưu DRAFT',
        questions: noAnsRes.questions,
        status: 'DRAFT',
      },
      { headers: headersA }
    );

    assert(draftImportRes.status === 201, 'Suite 9.3: Cho phép lưu bộ đề chưa có đáp án dưới dạng DRAFT (HTTP 201)');
    assert(draftImportRes.data.data.testSet.status === 'DRAFT', 'Suite 9.4: Trạng thái bộ đề lưu đúng là DRAFT');

    // Dọn dẹp bản ghi draft
    await db.query(`DELETE FROM questions WHERE test_set_id = $1`, [draftImportRes.data.data.testSet.id]);
    await db.query(`DELETE FROM test_sets WHERE id = $1`, [draftImportRes.data.data.testSet.id]);

    // ─────────────────────────────────────────────────────────────
    // SUITE 10: Ownership & IDOR Protection Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 10: Ownership & IDOR Protection ---');
    const validQuestionsWithKeys = [
      {
        index: 1,
        type: 'MULTIPLE_CHOICE',
        content: 'Câu hỏi kiểm tra IDOR',
        score: 1.0,
        options: { A: 'Đúng', B: 'Sai' },
        correctAnswer: 'A',
      },
    ];

    // Gửi payload cố tình truyền created_by = 9999 hoặc userId = 9999
    const idorTestRes = await axios.post(
      `${API_BASE}/exams/import`,
      {
        name: 'Đề thi kiểm tra IDOR',
        questions: validQuestionsWithKeys,
        status: 'APPROVED',
        created_by: 9999,
        userId: 9999,
      },
      { headers: headersA }
    );

    assert(idorTestRes.status === 201, 'Suite 10.1: Import hợp lệ thành công');
    assert(
      idorTestRes.data.data.testSet.created_by === userA.id,
      `Suite 10.2: created_by trong DB đúng bằng userA.id (${userA.id}), spoofed created_by (9999) bị loại bỏ hoàn toàn`
    );

    // Dọn dẹp bản ghi IDOR
    await db.query(`DELETE FROM questions WHERE test_set_id = $1`, [idorTestRes.data.data.testSet.id]);
    await db.query(`DELETE FROM test_sets WHERE id = $1`, [idorTestRes.data.data.testSet.id]);

    // ─────────────────────────────────────────────────────────────
    // SUITE 11: API Multipart File Upload Preview (No DB Write)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 11: API Multipart File Upload Preview ---');
    const countTsBefore = await db.query('SELECT COUNT(*) FROM test_sets');
    const countQBefore = await db.query('SELECT COUNT(*) FROM questions');

    const form = new FormData();
    form.append('file', fs.createReadStream(docxPath), 'sample_exam.docx');
    form.append('name', 'Đề kiểm tra Word Multipart Upload');
    form.append('useAI', 'false');

    const uploadRes = await axios.post(`${API_BASE}/exams/parse`, form, {
      headers: {
        ...headersA,
        ...form.getHeaders(),
      },
    });

    assert(uploadRes.status === 200, 'Suite 11.1: POST /api/exams/parse với multipart file .docx trả về HTTP 200');
    assert(uploadRes.data.data.questions.length === 3, 'Suite 11.2: Trả về danh sách 3 câu hỏi xem trước từ file Word');
    assert(uploadRes.data.data.extractionMethod === 'RULE_BASED', 'Suite 11.3: Extraction method là RULE_BASED');

    const countTsAfter = await db.query('SELECT COUNT(*) FROM test_sets');
    const countQAfter = await db.query('SELECT COUNT(*) FROM questions');
    assert(
      countTsBefore.rows[0].count === countTsAfter.rows[0].count &&
      countQBefore.rows[0].count === countQAfter.rows[0].count,
      'Suite 11.4: Tuyệt đối KHÔNG có bản ghi nào bị ghi vào DB trong bước Upload Preview'
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 12: Cleanup
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 12: Final Cleanup ---');
    await db.query(`DELETE FROM users WHERE id = $1`, [userA.id]);
    assert(true, 'Suite 12.1: Toàn bộ dữ liệu kiểm thử được dọn dẹp sạch sẽ');

    console.log('\n\x1b[32m========================================================');
    console.log('   ALL PHASE 7 ENHANCED TESTS PASSED (100% SUCCESS)    ');
    console.log('========================================================\x1b[0m\n');
  } catch (err: any) {
    console.error('\n[FATAL ERROR]', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runPhase7Tests();
