import { db, withTransaction } from '../src/db';

interface OpenCourseDoc {
  title: string;
  category: string;
  description: string;
  originalAuthor: string;
  license: string;
  sourceUrl: string;
  sampleContent: string;
}

const OPEN_EDUCATIONAL_RESOURCES: OpenCourseDoc[] = [
  {
    title: 'Giải tích 1: Hàm số, Giới hạn & Phép tính Vi phân',
    category: 'Toán học',
    description: 'Giáo trình Giải tích đại học chuẩn mực bao gồm hàm số một biến, giới hạn vô cùng, đạo hàm, định lý giá trị trung bình và ứng dụng tối ưu hóa.',
    originalAuthor: 'Edwin Herman & Gilbert Strang (OpenStax, Rice University)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/calculus-volume-1',
    sampleContent: `# Chương 1: Hàm số và Đồ thị
1.1 Tổng quan về hàm số thực: Miền xác định, miền giá trị, các phép biến đổi đồ thị.
1.2 Các hàm số sơ cấp cơ bản: Hàm đa thức, hàm hữu tỉ, hàm lượng giác và hàm mũ.

# Chương 2: Giới hạn và Tính liên tục
2.1 Khái niệm giới hạn hàm số: Định nghĩa epsilon-delta trực quan.
2.2 Các định lý về giới hạn: Quy tắc cộng, trừ, nhân, chia, định lý kẹp (Squeeze Theorem).
2.3 Tính liên tục của hàm số: Hàm liên tục trên một khoảng, định lý giá trị trung gian (IVT).

# Chương 3: Đạo hàm và Vi phân
3.1 Định nghĩa đạo hàm bằng giới hạn tỉ số vi phân f'(x) = lim_{h->0} [f(x+h) - f(x)] / h.
3.2 Quy tắc đạo hàm: Quy tắc nhân tử, quy tắc thương, quy tắc hàm hợp (Chain Rule).
3.3 Ứng dụng đạo hàm: Tốc độ biến thiên, vẽ đồ thị hàm số, bài toán tối ưu hóa thực tế.`
  },
  {
    title: 'Đại số Tuyến tính & Các Phép biến đổi Ma trận',
    category: 'Toán học',
    description: 'Tài liệu giáo trình mở toàn diện về không gian véc-tơ, hệ phương trình tuyến tính, định thức, ma trận trực giao và giá trị riêng (Eigenvalues).',
    originalAuthor: 'Cộng tác viên Wikibooks Toàn cầu (Wikibooks OER Project)',
    license: 'Creative Commons CC-BY-SA 3.0',
    sourceUrl: 'https://en.wikibooks.org/wiki/Linear_Algebra',
    sampleContent: `# Phần 1: Hệ phương trình tuyến tính và Ma trận
- Khử Gauss và khử Gauss-Jordan đưa ma trận về dạng bậc thang rút gọn (RREF).
- Phép nhân ma trận và ma trận nghịch đảo A^(-1).

# Phần 2: Không gian Véc-tơ (Vector Spaces)
- Không gian con, tổ hợp tuyến tính và tập sinh (Span).
- Độc lập tuyến tính, cơ sở (Basis) và số chiều (Dimension).

# Phần 3: Định thức và Giá trị riêng
- Định thức ma trận vuông det(A) và các tính chất cơ bản.
- Giá trị riêng (Eigenvalues) và véc-tơ riêng (Eigenvectors): Phương trình đặc trưng det(A - lambda*I) = 0.
- Chéo hóa ma trận và ứng dụng trong khoa học dữ liệu.`
  },
  {
    title: 'Vật lý Đại cương 1: Cơ học Cổ điển & Nhiệt động lực học',
    category: 'Toán học',
    description: 'Giáo trình nhập môn Vật lý kỹ thuật bao gồm động học, động lực học Newton, công - năng lượng, va chạm và các nguyên lý nhiệt động lực học.',
    originalAuthor: 'Samuel J. Ling, Jeff Sanny & William Moebs (OpenStax)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-1',
    sampleContent: `# Phần 1: Cơ học Newton
- Ba định luật Newton về chuyển động: Định luật quán tính, F = ma, Định luật tác dụng - phản tác dụng.
- Động lượng và định luật bảo toàn động lượng trong va chạm đàn hồi và mềm.
- Công cơ học và định lý động năng: W = delta(K). Thế năng và bảo toàn cơ năng.

# Phần 2: Chuyển động quay và Cân bằng
- Mô-men lực (Torque), mô-men quán tính (Moment of Inertia) và định luật II Newton cho chuyển động quay.
- Mô-men động lượng và sự bảo toàn mô-men động lượng.

# Phần 3: Nhiệt động lực học
- Nguyên lý 0 và nhiệt độ. Nguyên lý 1: delta(U) = Q - W.
- Nguyên lý 2 nhiệt động lực học: Entropi và hiệu suất động cơ nhiệt Carnot.`
  },
  {
    title: 'Cấu trúc Dữ liệu & Giải thuật Cơ bản',
    category: 'Khoa học máy tính',
    description: 'Cẩm nang giải thuật nền tảng: Phân tích độ phức tạp Big-O, Danh sách liên kết, Ngăn xếp, Hàng đợi, Cây nhị phân và các thuật toán tìm kiếm/sắp xếp.',
    originalAuthor: 'Cộng tác viên Wikibooks Data Structures (Wikibooks OER)',
    license: 'Creative Commons CC-BY-SA 3.0',
    sourceUrl: 'https://en.wikibooks.org/wiki/Data_Structures',
    sampleContent: `# 1. Phân tích độ phức tạp thuật toán (Big-O Notation)
- Đánh giá thời gian chạy (Time Complexity) và không gian bộ nhớ (Space Complexity).
- O(1), O(log n), O(n), O(n log n), O(n^2).

# 2. Các cấu trúc dữ liệu tuyến tính
- Arrays & Dynamic Arrays (Mảng động).
- Linked Lists (Đơn, Đôi, Vòng).
- Stacks (Ngăn xếp LIFO) và Queues (Hàng đợi FIFO, Hàng đợi ưu tiên).

# 3. Cấu trúc dữ liệu dạng cây và đồ thị
- Binary Search Tree (Cây tìm kiếm nhị phân - BST): Duyệt In-order, Pre-order, Post-order.
- Cây tự cân bằng: AVL Tree và Red-Black Tree.
- Đồ thị (Graph): Ma trận kề, danh sách kề, thuật toán BFS và DFS.

# 4. Thuật toán sắp xếp kinh điển
- QuickSort, MergeSort, HeapSort với độ phức tạp trung bình O(n log n).`
  },
  {
    title: 'Nhập môn Trí tuệ Nhân tạo & Thuật toán Học máy',
    category: 'Trí tuệ nhân tạo',
    description: 'Tài liệu nhập môn AI chính quy từ MIT OCW: Giải quyết vấn đề bằng tìm kiếm heuristic, Minimax trong trò chơi, Mạng nơ-ron và Học có giám sát.',
    originalAuthor: 'Prof. Patrick Henry Winston (MIT OpenCourseWare)',
    license: 'Creative Commons CC-BY-NC-SA 4.0',
    sourceUrl: 'https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/',
    sampleContent: `# 1. Tìm kiếm và Tối ưu hóa (Search & Heuristics)
- Không gian trạng thái (State Space Representation).
- Thuật toán tìm kiếm A* (A-Star) với hàm heuristic ước lượng chi phí f(n) = g(n) + h(n).
- Trò chơi đối kháng 2 người: Thuật toán Minimax và Kỹ thuật cắt tỉa Alpha-Beta Pruning.

# 2. Học có giám sát (Supervised Learning)
- Hồi quy tuyến tính (Linear Regression) và hàm mất mát MSE.
- Hồi quy Logistic (Logistic Regression) cho bài toán phân loại nhị phân.
- Cây quyết định (Decision Trees) và độ đo suy giảm entropy (Information Gain).

# 3. Mạng Nơ-ron Nhân tạo (Artificial Neural Networks)
- Mô hình Perceptron đơn giản và giải thuật lan truyền ngược (Backpropagation).
- Hàm kích hoạt phi tuyến: Sigmoid, Tanh, ReLU.
- Xu hướng học sâu (Deep Learning) và kiến trúc Transformer hiện đại.`
  },
  {
    title: 'Cơ sở Dữ liệu Quan hệ & Chuẩn hóa SQL',
    category: 'Khoa học máy tính',
    description: 'Giáo trình thiết kế cơ sở dữ liệu quan hệ, mô hình thực thể ERD, các dạng chuẩn 1NF, 2NF, 3NF, BCNF và truy vấn SQL tối ưu hóa.',
    originalAuthor: 'Adrienne Watt & Nelson Eng (BCcampus OpenEd)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://opentextbc.ca/dbdesign01/',
    sampleContent: `# Chương 1: Mô hình Dữ liệu và ERD
- Thực thể (Entity), Thuộc tính (Attribute) và Mối quan hệ (Relationship: 1-1, 1-N, N-N).
- Khóa chính (Primary Key), Khóa ngoại (Foreign Key) và tính toàn vẹn tham chiếu.

# Chương 2: Lý thuyết Chuẩn hóa Dữ liệu (Normalization)
- Dạng chuẩn 1 (1NF): Mọi giá trị thuộc tính phải là nguyên tử (Atomic).
- Dạng chuẩn 2 (2NF): Đạt 1NF và loại bỏ phụ thuộc hàm từng phần vào khóa chính.
- Dạng chuẩn 3 (3NF): Đạt 2NF và loại bỏ phụ thuộc bắc cầu.
- Chuẩn Boyce-Codd (BCNF).

# Chương 3: Ngôn ngữ Truy vấn SQL Nâng cao
- SELECT, JOIN (INNER, LEFT, RIGHT, FULL OUTER), GROUP BY, HAVING.
- Subqueries, Window Functions và Tối ưu hóa Index (B-Tree, GIN, Hash Index).`
  },
  {
    title: 'Kinh tế Vi mô Cơ bản: Thị trường & Cơ chế Giá cả',
    category: 'Kinh tế',
    description: 'Giáo trình nguyên lý kinh tế vi mô: Cung - cầu, độ co giãn, lý thuyết hành vi người tiêu dùng, chi phí sản xuất và các cấu trúc thị trường cạnh tranh.',
    originalAuthor: 'Steven A. Greenlaw & David Shapiro (OpenStax)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/principles-of-microeconomics-2e',
    sampleContent: `# Chương 1: Sự lựa chọn trong thế giới khan hiếm
- Khái niệm chi phí cơ hội (Opportunity Cost) và đường giới hạn khả năng sản xuất (PPF).
- Lợi thế tuyệt đối và lợi thế so sánh trong thương mại.

# Chương 2: Cung, Cầu và Điểm cân bằng thị trường
- Luật cầu (Law of Demand) và Luật cung (Law of Supply).
- Trọng tâm giá cả và số lượng cân bằng thị trường P*, Q*.
- Độ co giãn của cầu theo giá (Elasticity) và tác động đến tổng doanh thu.

# Chương 3: Cấu trúc thị trường
- Cạnh tranh hoàn hảo: P = MR = MC trong dài hạn.
- Độc quyền bán (Monopoly) và tổn thất xã hội (Deadweight Loss).
- Cạnh tranh độc quyền và Độc quyền nhóm (Oligopoly - Lý thuyết trò chơi Nash).`
  },
  {
    title: 'Kinh tế Vĩ mô: Tăng trưởng & Chính sách Tiền tệ',
    category: 'Kinh tế',
    description: 'Giáo trình kinh tế vĩ mô: Đo lường GDP, lạm phát, thất nghiệp, mô hình AS-AD, chính sách tài khóa của chính phủ và chính sách tiền tệ ngân hàng trung ương.',
    originalAuthor: 'Steven A. Greenlaw & Timothy Taylor (OpenStax)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/principles-of-macroeconomics-2e',
    sampleContent: `# Chương 1: Đo lường tổng sản phẩm quốc nội (GDP)
- Phương pháp tính GDP theo chi tiêu: GDP = C + I + G + (X - M).
- Phân biệt GDP danh nghĩa (Nominal GDP) và GDP thực tế (Real GDP).

# Chương 2: Lạm phát và Thất nghiệp
- Chỉ số giá tiêu dùng CPI và tốc độ lạm phát.
- Phân loại thất nghiệp: Cơ học, cơ cấu, chu kỳ. Tỷ lệ thất nghiệp tự nhiên.

# Chương 3: Mô hình Tổng cầu - Tổng cung (AD-AS) & Chính sách
- Các nhân tố dịch chuyển đường AD và SRAS / LRAS.
- Chính sách tài khóa mở rộng / thắt chặt của Chính phủ.
- Chính sách tiền tệ của Ngân hàng Trung ương: Lãi suất điều hành, cung tiền M2 và tỷ lệ dự trữ bắt buộc.`
  },
  {
    title: 'Sinh học Đại cương: Sinh học Tế bào & Di truyền học',
    category: 'Khác',
    description: 'Giáo trình sinh học đại cương: Cấu trúc tế bào nhân thực/nhân sơ, chuyển hóa năng lượng ATP, phân bào nguyên phân/giảm phân, quy luật di truyền Mendel và DNA.',
    originalAuthor: 'Mary Ann Clark, Matthew Douglas & Jung Choi (OpenStax)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    sampleContent: `# 1. Nền tảng Hóa học của Sự sống và Cấu trúc Tế bào
- Các đại phân tử sinh học: Carbohydrate, Lipid, Protein, Axit nucleic (DNA, RNA).
- Màng sinh chất và cơ chế vận chuyển chất qua màng (Khuếch tán, Vận chuyển chủ động qua bơm ATP).

# 2. Hô hấp Tế bào và Quang hợp
- Đường phân (Glycolysis), chu trình Krebs và chuỗi truyền điện tử trong ty thể.
- Pha sáng và pha tối (chu trình Calvin) của quá trình quang hợp trong lục lạp.

# 3. Phân bào và Di truyền học Phân tử
- Chu kỳ tế bào: Nguyên phân (Mitosis) tạo tế bào sinh dưỡng, Giảm phân (Meiosis) tạo giao tử.
- Quy luật phân ly và phân ly độc lập của Mendel.
- Cấu trúc chuỗi xoắn kép DNA, cơ chế tái bản bán bảo toàn và biểu hiện gen (Phiên mã & Dịch mã).`
  },
  {
    title: 'Tâm lý học Nhập môn: Nhận thức & Hành vi Con người',
    category: 'Khác',
    description: 'Giáo trình tâm lý học khoa học: Cơ sở sinh học của hành vi, các giai đoạn phát triển tâm lý, thuyết điều kiện hóa Pavlov/Skinner và nhận thức xã hội.',
    originalAuthor: 'Rose M. Spielman & William J. Jenkins (OpenStax)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/psychology-2e',
    sampleContent: `# Chương 1: Phương pháp nghiên cứu trong Tâm lý học
- Phương pháp quan sát tự nhiên, nghiên cứu tình huống (Case study), khảo sát và thực nghiệm đối chứng.
- Đạo đức trong nghiên cứu tâm lý con người.

# Chương 2: Cơ sở Sinh học của Hành vi và Trí nhớ
- Cấu tạo tế bào thần kinh (Neuron), chất dẫn truyền thần kinh (Dopamine, Serotonin, Acetylcholine).
- Các bán cầu não và thùy não: Thùy trán, thùy đỉnh, thùy thái dương, thùy chẩm.
- Hệ thống trí nhớ: Trí nhớ tức thời, trí nhớ ngắn hạn (Working Memory) và trí nhớ dài hạn.

# Chương 3: Quá trình Học tập và Tâm lý Xã hội
- Điều kiện hóa cổ điển (Classical Conditioning - Pavlov) và Điều kiện hóa từ kết quả (Operant Conditioning - Skinner).
- Thuyết học tập xã hội của Albert Bandura (Quan sát và bắt chước).
- Thiên kiến nhận thức (Cognitive Biases) và tâm lý đám đông.`
  },
  {
    title: 'Xác suất Thống kê cho Kỹ thuật & Phân tích Dữ liệu',
    category: 'Toán học',
    description: 'Giáo trình xác suất và suy diễn thống kê: Biến ngẫu nhiên, phân phối chuẩn, định lý giới hạn trung tâm, kiểm định giả thuyết và hồi quy tuyến tính.',
    originalAuthor: 'Barbara Illowsky & Susan Dean (OpenStax)',
    license: 'Creative Commons CC-BY 4.0',
    sourceUrl: 'https://openstax.org/details/books/introductory-statistics',
    sampleContent: `# Phần 1: Thống kê Mô tả và Không gian Xác suất
- Các đại lượng trung tâm: Kỳ vọng (Mean), Trung vị (Median), Yếu vị (Mode).
- Độ phân tán: Phương sai (Variance), Độ lệch chuẩn (Standard Deviation), Khoảng tứ phân vị (IQR).
- Quy tắc cộng, quy tắc nhân xác suất, xác suất có điều kiện P(A|B) và định lý Bayes.

# Phần 2: Các Phân phối Xác suất Quan trọng
- Phân phối rời rạc: Nhị thức (Binomial), Poisson.
- Phân phối liên tục: Phân phối đều (Uniform), Phân phối chuẩn (Normal Distribution - Bell Curve), Phân phối chuẩn hóa Z.
- Định lý Giới hạn Trung tâm (Central Limit Theorem - CLT).

# Phần 3: Thống kê Suy diễn & Kiểm định Giả thuyết
- Khoảng tin cậy (Confidence Interval) cho trung bình tổng thể.
- Kiểm định giả thuyết H0 và Ha: Mức ý nghĩa alpha, giá trị p-value, kiểm định Z-test và T-test Student.`
  },
  {
    title: 'Tiếng Anh Học thuật: Cẩm nang Viết Luận & Trích dẫn Nghiên cứu',
    category: 'Ngoại ngữ',
    description: 'Giáo trình viết học thuật (Academic Writing): Cấu trúc đoạn văn học thuật, liên kết ý câu luận điểm, lập dàn ý bài tiểu luận và chuẩn trích dẫn APA/MLA.',
    originalAuthor: 'Cộng tác viên Wikibooks Rhetoric and Composition (Wikibooks OER)',
    license: 'Creative Commons CC-BY-SA 3.0',
    sourceUrl: 'https://en.wikibooks.org/wiki/Rhetoric_and_Composition',
    sampleContent: `# Module 1: The Anatomy of an Academic Essay
- Crafting a strong Thesis Statement: specific, arguable, and concise.
- Paragraph development: Topic sentence, supporting evidence, critical analysis, and transitional hook.
- Rhetorical appeals: Ethos (credibility), Pathos (emotion), and Logos (logic/evidence).

# Module 2: Sentence Variety and Academic Register
- Formal grammar conventions: avoiding contractions, colloquialisms, and vague pronouns.
- Cohesive devices and logical connectors (Furthermore, Conversely, In light of, Consequently).
- Synthesizing multiple scholarly sources without patchwriting.

# Module 3: Citation Standards and Avoiding Plagiarism
- Distinguishing between Direct Quotation, Paraphrasing, and Summarizing.
- In-text citation formatting for APA 7th Edition: (Author, Year, p. XX).
- References page compilation and DOI handling for peer-reviewed journal articles.`
  }
];

async function importOpenEducationalResources() {
  console.log('=== STARTING OPEN EDUCATIONAL RESOURCES (OER) IMPORT ===\n');

  const client = await db.connect();
  try {
    // 1. Get or create system user "Thư viện mở Cognito"
    const libraryUserRes = await client.query("SELECT id FROM users WHERE email = 'openlibrary@cognito.edu.vn'");
    if (libraryUserRes.rows.length === 0) {
      throw new Error('System user openlibrary@cognito.edu.vn not found. Run purge-test-data.ts first!');
    }
    const libraryUserId = libraryUserRes.rows[0].id;
    console.log(`System user "Thư viện mở Cognito" ID: ${libraryUserId}`);

    let insertedCount = 0;

    for (const doc of OPEN_EDUCATIONAL_RESOURCES) {
      // Check if document with this title already exists
      const existing = await client.query(
        'SELECT id FROM documents WHERE user_id = $1 AND title = $2',
        [libraryUserId, doc.title]
      );

      let docId: number;
      if (existing.rows.length === 0) {
        const insertDocRes = await client.query(`
          INSERT INTO documents (
            user_id,
            title,
            description,
            category,
            visibility,
            is_community_published,
            is_open_license,
            license,
            original_author,
            source_url,
            solution_text,
            status,
            processing_status,
            file_type,
            like_count,
            save_count,
            is_test,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, 'public', true, true, $5, $6, $7, $8, 'READY', 'READY', 'text/markdown', 0, 0, false, NOW(), NOW()
          ) RETURNING id
        `, [
          libraryUserId,
          doc.title,
          doc.description,
          doc.category,
          doc.license,
          doc.originalAuthor,
          doc.sourceUrl,
          doc.sampleContent
        ]);
        docId = insertDocRes.rows[0].id;
        insertedCount++;
        console.log(`✅ Imported document: [ID ${docId}] "${doc.title}"`);
      } else {
        docId = existing.rows[0].id;
        console.log(`ℹ️ Document already exists: [ID ${docId}] "${doc.title}"`);
      }

      // Synchronize with community_resources table
      const existingComm = await client.query(
        "SELECT id FROM community_resources WHERE resource_type = 'document' AND resource_id = $1",
        [docId]
      );

      if (existingComm.rows.length === 0) {
        await client.query(`
          INSERT INTO community_resources (
            user_id,
            resource_type,
            resource_id,
            title,
            description,
            category,
            tags,
            is_public,
            is_hidden,
            is_test,
            created_at,
            updated_at
          ) VALUES (
            $1, 'document', $2, $3, $4, $5, $6, true, false, false, NOW(), NOW()
          )
        `, [
          libraryUserId,
          docId,
          doc.title,
          doc.description,
          doc.category,
          ['Nguồn mở', 'OER', doc.category]
        ]);
        console.log(`   └─ Published to community feed: "${doc.title}"`);
      }
    }

    console.log(`\n🎉 Successfully imported ${insertedCount} Open Educational Resources!`);
    console.log('Total OER documents in catalog: ' + OPEN_EDUCATIONAL_RESOURCES.length);

  } catch (err: any) {
    console.error('❌ Import failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

importOpenEducationalResources();
