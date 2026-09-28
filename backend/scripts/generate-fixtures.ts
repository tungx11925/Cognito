import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export async function generateTestFixtures() {
  const fixtureDir = path.join(process.cwd(), 'uploads/test_fixtures');
  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }

  // 1. Generate real .docx file: sample_exam.docx
  const docxPath = path.join(fixtureDir, 'sample_exam.docx');
  const zip = new JSZip();

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const paragraphs = [
    'ĐỀ THI MẪU FILE WORD DOCX',
    '',
    'Câu 1: Thủ đô của Việt Nam là thành phố nào?',
    'A. TP. Hồ Chí Minh',
    'B. Hà Nội',
    'C. Đà Nẵng',
    'D. Hải Phòng',
    'Đáp án: B',
    '',
    'Câu 2: Số nguyên tố chẵn duy nhất trong tập hợp số tự nhiên là?',
    'A. 0',
    'B. 2',
    'C. 4',
    'D. 6',
    'Đáp án: B',
    '',
    'Câu 3: Đơn vị đo cường độ dòng điện trong hệ SI là gì?',
    'A. Vôn (V)',
    'B. Oát (W)',
    'C. Ampe (A)',
    'D. Ôm (Ohm)',
    'Đáp án: C',
  ];

  const pXml = paragraphs
    .map(p => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`)
    .join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pXml}
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', docXml);

  const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(docxPath, docxBuffer);
  console.log('✅ Generated sample_exam.docx at:', docxPath);

  // 2. Generate real .pdf with text layer: sample_exam.pdf
  // Minimal valid PDF 1.4 specification with font & text stream
  const pdfPath = path.join(fixtureDir, 'sample_exam.pdf');
  const streamContent = `BT
/F1 12 Tf
50 750 Td
(DE THI THU MON VAT LY HOC KY 1) Tj
0 -30 Td
(Cau 1: Hat nhan nguyen tu duoc cau tao tu nhung loai hat nao?) Tj
0 -20 Td
(A. Proton va Electron) Tj
0 -15 Td
(B. Proton va Neutron) Tj
0 -15 Td
(C. Neutron va Electron) Tj
0 -15 Td
(D. Chi co Proton) Tj
0 -25 Td
(Cau 2: Song anh sang la loai song nao sau day?) Tj
0 -20 Td
(A. Song doc) Tj
0 -15 Td
(B. Song ngang) Tj
0 -15 Td
(C. Song co hoc) Tj
0 -15 Td
(D. Song am) Tj
0 -30 Td
(BANG DAP AN: 1.B 2.B) Tj
ET`;

  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000240 00000 n 
0000000${(300 + streamLength).toString().padStart(3, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${370 + streamLength}
%%EOF`;

  fs.writeFileSync(pdfPath, pdfContent, 'utf-8');
  console.log('✅ Generated sample_exam.pdf at:', pdfPath);

  // 3. Generate empty/corrupt PDF & Scanned dummy file
  const emptyPdfPath = path.join(fixtureDir, 'empty_scanned.pdf');
  // Valid PDF container but 0 text objects
  const emptyPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
185
%%EOF`;
  fs.writeFileSync(emptyPdfPath, emptyPdfContent, 'utf-8');
  console.log('✅ Generated empty_scanned.pdf at:', emptyPdfPath);

  // 4. Generate fake disguised file (an .exe content renamed to .pdf)
  const fakePdfPath = path.join(fixtureDir, 'disguised_fake.pdf');
  const fakeExeContent = 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode.';
  fs.writeFileSync(fakePdfPath, fakeExeContent, 'utf-8');
  console.log('✅ Generated disguised_fake.pdf at:', fakePdfPath);

  return { docxPath, pdfPath, emptyPdfPath, fakePdfPath };
}

if (require.main === module) {
  generateTestFixtures().catch(console.error);
}
