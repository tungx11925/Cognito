import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { db } from '../src/db';
import { examParserService } from '../src/services/exam-parser.service';

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
    // SUITE 1: Rule-based regex parsing (Zero AI token waste)
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
    // SUITE 2: Answer Key Table at bottom (BẢNG ĐÁP ÁN: 1.B, 2.D...)
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
    // SUITE 4: Multi-format Extraction (Excel XLSX file)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Multi-format Parser (Excel XLSX) ---');
    const scratchDir = path.join(process.cwd(), 'uploads/scratch_test');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

    const xlsxFilePath = path.join(scratchDir, 'test_exam.xlsx');
    const wb = xlsx.utils.book_new();
    const wsData = [
      ['Câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án đúng'],
      ['Câu 1: 1 + 1 bằng mấy?', 'A. 1', 'B. 2', 'C. 3', 'D. 4', 'Đáp án: B'],
      ['Câu 2: Thủ đô của Pháp là gì?', 'A. London', 'B. Berlin', 'C. Paris', 'D. Madrid', 'Đáp án: C'],
    ];
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    xlsx.utils.book_append_sheet(wb, ws, 'Questions');
    xlsx.writeFile(wb, xlsxFilePath);

    const xlsxText = await examParserService.extractTextFromFile(xlsxFilePath, 'test_exam.xlsx');
    assert(xlsxText.includes('Câu 1') && xlsxText.includes('Paris'), 'Suite 4.1: Trích xuất dữ liệu thô từ file Excel .xlsx thành công');

    const xlsxParseResult = await examParserService.parseExam({
      filePath: xlsxFilePath,
      originalName: 'test_exam.xlsx',
      name: 'Đề thi kiểm tra từ Excel',
      useAI: false,
    });
    assert(xlsxParseResult.questions.length >= 2, 'Suite 4.2: Bóc tách thành công các câu hỏi từ file Excel');
    assert(xlsxParseResult.extractionMethod === 'RULE_BASED', 'Suite 4.3: Extraction method là RULE_BASED (không tốn token AI)');

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: API Preview Endpoint (POST /api/exams/parse) — No DB Write!
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: API Preview Endpoint (No DB Write) ---');
    const countTsBefore = await db.query('SELECT COUNT(*) FROM test_sets');
    const countQBefore = await db.query('SELECT COUNT(*) FROM questions');

    const previewRes = await axios.post(
      `${API_BASE}/exams/parse`,
      {
        textContent: examTextInline,
        name: 'Đề Toán ôn tập Preview',
        useAI: false,
      },
      { headers: headersA }
    );

    assert(previewRes.status === 200, 'Suite 5.1: POST /api/exams/parse trả về HTTP 200');
    assert(previewRes.data.success === true, 'Suite 5.2: Phản hồi thành công với payload chuẩn');
    assert(previewRes.data.data.questions.length === 3, 'Suite 5.3: Trả về danh sách 3 câu hỏi cho client xem trước');
    assert(previewRes.data.data.extractionMethod === 'RULE_BASED', 'Suite 5.4: Extraction method đúng là RULE_BASED');

    const countTsAfter = await db.query('SELECT COUNT(*) FROM test_sets');
    const countQAfter = await db.query('SELECT COUNT(*) FROM questions');
    assert(
      countTsBefore.rows[0].count === countTsAfter.rows[0].count &&
      countQBefore.rows[0].count === countQAfter.rows[0].count,
      'Suite 5.5: KHÔNG có bản ghi nào bị ghi vào DB trong bước Preview (tuân thủ nghiêm ngặt quy trình)'
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: User Correction & Import Endpoint (POST /api/exams/import)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: User Correction & Import to Database ---');
    const correctedQuestions = [
      {
        index: 1,
        type: 'MULTIPLE_CHOICE',
        content: 'Đạo hàm của hàm số y = x^2 là gì? (Đã hiệu chỉnh)',
        score: 1.5,
        options: { A: '2x', B: 'x', C: '2', D: 'x^2' },
        correctAnswer: 'A',
      },
      {
        index: 2,
        type: 'MULTIPLE_CHOICE',
        content: 'Nguyên hàm của hàm số f(x) = 2x là gì? (Đã hiệu chỉnh)',
        score: 1.5,
        options: { A: 'x^2 + C', B: '2x^2 + C', C: 'x + C', D: '2 + C' },
        correctAnswer: 'A',
      },
    ];

    const importRes = await axios.post(
      `${API_BASE}/exams/import`,
      {
        name: 'Đề thi đã hiệu chỉnh sau Preview',
        questions: correctedQuestions,
        status: 'APPROVED',
      },
      { headers: headersA }
    );

    assert(importRes.status === 201, 'Suite 6.1: POST /api/exams/import trả về HTTP 201 Created');
    assert(importRes.data.data.testSet.name === 'Đề thi đã hiệu chỉnh sau Preview', 'Suite 6.2: Tên bộ đề được lưu chính xác');
    assert(importRes.data.data.testSet.status === 'APPROVED', 'Suite 6.3: Trạng thái bộ đề lưu đúng APPROVED');
    assert(Number(importRes.data.data.testSet.total_score) === 3.0, 'Suite 6.4: Tổng điểm được tính chính xác (1.5 + 1.5 = 3.0)');
    assert(importRes.data.data.questions.length === 2, 'Suite 6.5: Lưu đúng 2 câu hỏi vào bảng questions');

    // ─────────────────────────────────────────────────────────────
    // SUITE 7: Authorization & Validation Security
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 7: Security & Input Validation ---');
    try {
      await axios.post(`${API_BASE}/exams/parse`, { textContent: 'Quá ngắn' });
      assert(false, 'Suite 7.1: Bắt buộc từ chối khi không có token (Expected 401)');
    } catch (err: any) {
      assert(err.response?.status === 401, 'Suite 7.1: Từ chối truy cập unauthenticated (HTTP 401)');
    }

    try {
      await axios.post(`${API_BASE}/exams/parse`, { textContent: '' }, { headers: headersA });
      assert(false, 'Suite 7.2: Bắt buộc từ chối khi nội dung rỗng (Expected 400)');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Suite 7.2: Từ chối nội dung rỗng hoặc thiếu file (HTTP 400)');
    }

    try {
      await axios.post(`${API_BASE}/exams/import`, { name: 'Đề lỗi', questions: [] }, { headers: headersA });
      assert(false, 'Suite 7.3: Bắt buộc từ chối khi danh sách questions rỗng (Expected 400)');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Suite 7.3: Từ chối danh sách questions rỗng (HTTP 400)');
    }

    // ─────────────────────────────────────────────────────────────
    // SUITE 8: Cleanup test artifacts
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 8: Cleanup ---');
    if (fs.existsSync(xlsxFilePath)) fs.unlinkSync(xlsxFilePath);
    if (fs.existsSync(scratchDir)) fs.rmdirSync(scratchDir);

    await db.query(`DELETE FROM questions WHERE test_set_id = $1`, [importRes.data.data.testSet.id]);
    await db.query(`DELETE FROM test_sets WHERE id = $1`, [importRes.data.data.testSet.id]);
    await db.query(`DELETE FROM users WHERE id IN ($1)`, [userA.id]);
    assert(true, 'Suite 8.1: Toàn bộ dữ liệu kiểm thử được dọn dẹp sạch sẽ');

    console.log('\n\x1b[32m========================================================');
    console.log('       ALL PHASE 7 INTEGRATION TESTS PASSED (100%)       ');
    console.log('========================================================\x1b[0m\n');
  } catch (err: any) {
    console.error('\n[FATAL ERROR]', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runPhase7Tests();
