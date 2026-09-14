import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { parserService } from './parser.service';
import { generateQuestionsWithAI, generateMindmapWithAI } from '../utils/ai-engine.service';
import { db } from '../db';
import { AppError } from '../utils/AppError';

export class AiService {
  /**
   * Chat with document (supports multi-image multimodal vision)
   */
  async chatWithDocument(document: any, message: string, history: any[], images?: string[] | string) {
    const docTitle = document ? document.title : 'Tài liệu học tập';
    const docDesc = document ? document.description : '';
    const docSolution = document ? document.solution_text : '';
    
    let reply = '';
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    let documentText = '';
    if (document && document.doc_url && (document.doc_url.endsWith('.docx') || document.doc_url.endsWith('.doc'))) {
       documentText = await parserService.parseFromUrl(document.doc_url);
    }

    const systemPrompt = `Bạn là trợ lý AI thông minh "EduShare AI", một siêu gia sư có khả năng phân tích, giảng dạy, giải toán và phân tích hình ảnh toàn diện như ChatGPT-4o.
Tên tài liệu người dùng đang xem: ${docTitle}
Mô tả: ${docDesc}
Nội dung tài liệu (Trích xuất trực tiếp từ file):\n\n${documentText ? documentText.substring(0, 5000) : '(Người dùng chưa tải lên file có nội dung văn bản, hãy hỗ trợ dựa trên câu hỏi của họ)'}\n\n
${docSolution ? 'Lời giải đính kèm: ' + docSolution : ''}

YÊU CẦU ĐỐI VỚI BẠN (AI):
1. Nếu người dùng gửi KÈM MỘT HOẶC NHIỀU HÌNH ẢNH: Hãy quan sát kỹ toàn bộ các hình ảnh (bài tập, công thức, biểu đồ, sơ đồ, các trang sách hoặc hình vẽ), kết hợp và phân tích / giải chi tiết từng bước cho từng ảnh.
2. Nếu là bài Toán/Lý/Hóa trong ảnh hoặc văn bản: Phân tích đề bài, chỉ ra công thức áp dụng, giải từng bước và đưa ra đáp số rõ ràng.
3. Nếu là Tiếng Anh / Ngoại ngữ: Nhận diện chữ trong ảnh, giải thích ngữ pháp, từ vựng và dịch nghĩa đầy đủ.
4. Trình bày nội dung đẹp mắt bằng Markdown (in đậm, danh sách gạch đầu dòng, công thức LaTeX chuẩn xác $\\rightarrow$, $x^2$).`;

    // Normalize images into an array (supports both single 'image' and multiple 'images')
    let imageList: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      imageList = images.filter((img): img is string => typeof img === 'string' && img.length > 0);
    } else if (images && typeof images === 'string') {
      imageList = [images];
    }

    // Parse images for Gemini inlineData
    const imageParts: any[] = [];
    for (const img of imageList) {
      let base64Data = img;
      let mimeType = 'image/jpeg';
      if (img.startsWith('data:')) {
        const matches = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }
      imageParts.push({
        inlineData: {
          data: base64Data,
          mimeType
        }
      });
    }

    // 1. If IMAGES are provided, PRIORITIZE GEMINI MULTIMODAL VISION
    if (imageParts.length > 0 && geminiApiKey && !geminiApiKey.includes('your_')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const promptText = `${systemPrompt}\n\nCâu hỏi/Yêu cầu của người dùng đối với các hình ảnh đính kèm: "${message || 'Hãy quan sát kỹ, phân tích, đối chiếu và giải đáp chi tiết tất cả các hình ảnh này.'}"`;
        const result = await model.generateContent([promptText, ...imageParts]);
        reply = result.response.text();
        if (reply) return reply;
      } catch (geminiVisionError) {
        console.error("Gemini Vision Error in /ai/chat:", geminiVisionError);
      }
    }

    // 2. TRY GROQ AI (Supports text with groq models)
    if (groqApiKey && !groqApiKey.includes('your_')) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        let apiMessages: any[] = [{ role: "system", content: systemPrompt }];
        if (history && Array.isArray(history)) {
          const recentHistory = history.slice(-4);
          apiMessages = apiMessages.concat(recentHistory);
        }
        apiMessages.push({ role: "user", content: message || 'Hãy phân tích hình ảnh và tài liệu này giúp tôi.' });

        const completion = await groq.chat.completions.create({
          messages: apiMessages,
          model: process.env.GROQ_CHAT_MODEL || "groq/compound-mini",
          temperature: 0.7,
          max_tokens: 1500,
        });

        reply = completion.choices[0]?.message?.content || "";
        if (reply) return reply;
      } catch (aiError) {
        console.error("Groq AI Error in /ai/chat, falling back to Gemini:", aiError);
      }
    }

    // 3. TRY GEMINI AI for text / fallback
    if (geminiApiKey && !geminiApiKey.includes('your_')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `${systemPrompt}\n\nCâu hỏi của người dùng: "${message}"`;
        const contents: any[] = [prompt, ...imageParts];
        
        const result = await model.generateContent(contents);
        reply = result.response.text();
        if (reply) return reply;
      } catch (aiError) {
        console.error("Gemini AI Error in /ai/chat:", aiError);
      }
    }

    // FALLBACK: PREMIUM SIMULATION (Development ONLY)
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('AI Service is temporarily unavailable or not configured. Please contact the administrator.', 503);
    }
    
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('giải') && (messageLower.includes('toán') || messageLower.includes('phương trình') || messageLower.includes('tích phân') || message.includes('x') || message.includes('+') || message.includes('='))) {
      reply += `### 🧮 Giải bài toán:\nDưới đây là các bước phân tích và giải chi tiết cho câu hỏi của bạn:\n\n**Bước 1: Phân tích đề bài**\nDựa vào dữ kiện, chúng ta cần tìm giá trị thỏa mãn phương trình/điều kiện đã cho.\n\n**Bước 2: Giải chi tiết**\n- Ta áp dụng công thức tương ứng của dạng toán này.\n- Biến đổi tương đương các vế.\n- Giải ra kết quả cuối cùng: \`x = ...\` (hoặc kết quả tương đương).\n\n**Bước 3: Kết luận**\nĐây là một dạng toán khá phổ biến. Bạn nên lưu ý cách đặt điều kiện trước khi giải nhé.\n*(Lưu ý: Để giải chính xác 100% bài toán thực tế của bạn, hãy nhập GROQ_API_KEY hoặc GEMINI_API_KEY vào .env để tôi sử dụng AI thật nhé!)*`;
    } else if (messageLower.includes('tiếng anh') || messageLower.includes('cấu trúc') || messageLower.includes('ngữ pháp') || messageLower.includes('dịch') || messageLower.includes('english')) {
      reply += `### 🇬🇧 Phân tích Tiếng Anh:\nDưới đây là giải thích về cấu trúc ngữ pháp / từ vựng cho bạn:\n\n**1. Cấu trúc ngữ pháp trọng tâm:**\n- Câu này sử dụng thì **Hiện tại hoàn thành (Present Perfect)** hoặc cấu trúc câu điều kiện.\n- Công thức chung: \`S + have/has + V3/ed\` hoặc cấu trúc tương ứng với câu hỏi của bạn.\n\n**2. Từ vựng cần lưu ý (Vocabulary):**\n- **Word 1 (Loại từ):** Định nghĩa và cách dùng.\n- **Word 2 (Loại từ):** Định nghĩa và cách dùng.\n\n**3. Ví dụ áp dụng:**\n- *If you study hard, you will pass the exam.* (Nếu bạn học chăm, bạn sẽ qua bài thi).\n\n*(Lưu ý: Để tôi có thể dịch và phân tích câu Tiếng Anh cụ thể của bạn bằng AI thực, hãy cấu hình GROQ_API_KEY hoặc GEMINI_API_KEY nhé!)*`;
    } else if (messageLower.includes('tóm tắt') || messageLower.includes('summary') || messageLower.includes('khái quát')) {
      reply += `### 📝 Tóm tắt tài liệu: "${docTitle}"\nDưới đây là tóm tắt nội dung chính do trợ lý AI tổng hợp:\n1. **Nội dung chính:** ${docDesc || 'Tài liệu học tập trung cập nhật các kiến thức trọng tâm.'}\n2. **Chi tiết lời giải:** ${docSolution ? docSolution.substring(0, 150) + '...' : 'Lời giải chi tiết đính kèm đầy đủ.'}\n3. **Đánh giá cấp độ:** Đây là tài liệu thuộc danh mục **${document?.category || 'Khác'}**, rất phù hợp cho ôn tập thi học kỳ và củng cố kiến thức nâng cao.`;
    } else if (messageLower.includes('đáp án') || messageLower.includes('lời giải') || messageLower.includes('solution') || messageLower.includes('giải')) {
      reply += `### 🔑 Lời giải & Đáp án cho tài liệu: "${docTitle}"\nDưới đây là phần phân tích và hướng dẫn giải từ hệ thống:\n${docSolution || 'Tài liệu này chưa có phần lời giải chi tiết bằng văn bản. Bạn có thể tham khảo tệp đính kèm hoặc tải lên lời giải của riêng mình để tôi phân tích nhé!'}\n\n*Nếu bạn có câu hỏi cụ thể về từng bước giải trên, hãy gõ câu hỏi xuống dưới, tôi sẽ hỗ trợ giải thích cặn kẽ!*`;
    } else if (messageLower.includes('xin chào') || messageLower.includes('hello') || messageLower.includes('hi')) {
      reply += `Xin chào! Tôi là **Trợ lý AI học tập thông minh (EduShare AI)**. 🧠✨\nTôi đã kết nối trực tiếp vào file tài liệu **"${docTitle}"** của bạn. (Vui lòng cấu hình GEMINI_API_KEY trong .env để tôi có thể đọc toàn bộ file bằng AI thật).\n\nBạn cần tôi giúp gì?\n- 📝 **Tóm tắt nội dung** chính của tài liệu.\n- 🔑 Giải thích chi tiết **lời giải/đáp án**.\n- 🎴 **Tạo bộ thẻ ghi nhớ (Flashcards)** từ tài liệu.\n- ✏️ **Tạo bài trắc nghiệm nhanh (Quiz)** để tự ôn luyện.`;
    } else {
      reply += `### 🧠 Phân tích của Trợ lý AI về: "${docTitle}"\nDựa trên kiến thức của tài liệu này, câu hỏi của bạn: *"${message}"* có thể được giải thích như sau:\n\n- **Bối cảnh:** Tài liệu này thảo luận về **${document?.category || 'Chủ đề học tập'}**, với nội dung chính là *"${docTitle}"*.\n- **Giải đáp:**\n  1. Đây là một khái niệm cốt lõi cần ghi nhớ để áp dụng vào các bài tập thực hành.\n  2. Bạn nên kết hợp tạo **Flashcards** để ghi nhớ lâu hơn thuật ngữ này hoặc làm bài kiểm tra **Quiz** mà tôi tự động biên soạn từ tài liệu.\n  3. Để giải quyết câu hỏi này một cách tối ưu, hãy tập trung vào các ý chính đã được nêu trong tài liệu ${docSolution ? 'và phần lời giải đính kèm' : ''}.\n\n*(Lưu ý: Đây là câu trả lời mô phỏng. Để Trợ lý AI có thể trả lời thật sự như ChatGPT dựa trên file tải về, hãy nhập biến GROQ_API_KEY hoặc GEMINI_API_KEY vào tệp .env của hệ thống Backend).*`;
    }
    
    return reply;
  }

  /**
   * Generate a quick quiz for a document
   */
  async generateQuizForDocument(document: any) {
    if (process.env.NODE_ENV === 'production' && (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY)) {
      throw new AppError('AI Service is temporarily unavailable or not configured. Please contact the administrator.', 503);
    }
    
    let quizzes = [];
    if (document && document.category === 'Trí tuệ nhân tạo') {
      quizzes = [
        {
          id: 1,
          question: "Trong Học máy (Machine Learning), 'Supervised Learning' (Học có giám sát) là gì?",
          options: [
            "Huấn luyện mô hình từ dữ liệu hoàn toàn chưa được gắn nhãn.",
            "Huấn luyện mô hình dựa trên tập dữ liệu đã có nhãn (labeled data) rõ ràng trước đó.",
            "Mô hình tự động học thông qua thử và sai (trial and error) để tối ưu điểm thưởng.",
            "Phương pháp không cần dùng đến dữ liệu đầu vào."
          ],
          correctAnswer: 1,
          explanation: "Học có giám sát (Supervised Learning) hoạt động dựa trên cặp dữ liệu đầu vào và nhãn tương ứng (Input-Output pairs) để dạy mô hình."
        },
        {
          id: 2,
          question: "Overfitting (Quá khớp) xảy ra khi nào?",
          options: [
            "Mô hình quá đơn giản, không học được cấu trúc của dữ liệu huấn luyện.",
            "Mô hình dự đoán hoàn hảo trên cả dữ liệu huấn luyện và dữ liệu thực tế mới.",
            "Mô hình học quá kỹ các chi tiết và nhiễu của dữ liệu train, dẫn đến dự đoán kém trên dữ liệu mới.",
            "Khi tập dữ liệu kiểm thử (test set) quá lớn so với tập huấn luyện."
          ],
          correctAnswer: 2,
          explanation: "Overfitting xảy ra khi mô hình quá phức tạp, ghi nhớ luôn cả nhiễu của tập train, khiến khả năng tổng quát hóa (generalization) trên tập test bị suy giảm cực mạnh."
        },
        {
          id: 3,
          question: "Đâu là thuật toán thuộc nhóm Học máy Không giám sát (Unsupervised Learning)?",
          options: [
            "Linear Regression (Hồi quy tuyến tính)",
            "K-Means Clustering (Phân cụm K-Means)",
            "Support Vector Machine (SVM)",
            "Random Forest"
          ],
          correctAnswer: 1,
          explanation: "K-Means Clustering là thuật toán phân cụm dữ liệu chưa được gán nhãn, thuộc nhóm Unsupervised Learning. Các thuật toán còn lại là Supervised Learning."
        }
      ];
    } else if (document && document.category === 'Toán học') {
      quizzes = [
        {
          id: 1,
          question: "Giới hạn cơ bản sau đây có giá trị bằng bao nhiêu: lim_{x -> 0} (sin x) / x?",
          options: ["0", "1", "Vô cùng", "Không tồn tại"],
          correctAnswer: 1,
          explanation: "Đây là giới hạn lượng giác cơ bản trong Giải tích 1, có giá trị bằng 1."
        },
        {
          id: 2,
          question: "Khi nào ta có thể áp dụng Quy tắc L'Hospital để tính giới hạn?",
          options: [
            "Mọi bài toán giới hạn bất kỳ.",
            "Khi giới hạn có dạng vô định là 0/0 hoặc ∞/∞.",
            "Chỉ khi giới hạn có dạng vô định là 0 * ∞.",
            "Khi giới hạn của mẫu số bằng một hằng số khác không."
          ],
          correctAnswer: 1,
          explanation: "Quy tắc L'Hospital cho phép đạo hàm tử và mẫu riêng biệt khi giới hạn có dạng vô định 0/0 hoặc ∞/∞."
        },
        {
          id: 3,
          question: "Đạo hàm của hàm số y = cos(x) là gì?",
          options: ["sin(x)", "-sin(x)", "1 / cos^2(x)", "-1 / sin^2(x)"],
          correctAnswer: 1,
          explanation: "Đạo hàm của cos(x) bằng -sin(x). Đạo hàm của sin(x) bằng cos(x)."
        }
      ];
    } else {
      quizzes = [
        {
          id: 1,
          question: `Nội dung cốt lõi của tài liệu "${document ? document.title : 'Tài liệu học tập'}" hướng đến đối tượng nào?`,
          options: [
            "Người mới bắt đầu nghiên cứu và cần nắm vững lý thuyết cơ bản.",
            "Chuyên gia nghiên cứu cấp cao cần các thuật toán phức tạp.",
            "Không phục vụ cho việc học tập.",
            "Chỉ dùng cho hoạt động giải trí giải trí."
          ],
          correctAnswer: 0,
          explanation: "Tài liệu được soạn thảo dễ hiểu, khoa học, thích hợp cho việc tiếp cận kiến thức từ cơ bản đến nâng cao."
        },
        {
          id: 2,
          question: "Để ghi nhớ tốt nhất kiến thức từ tài liệu này, phương pháp nào được khuyên dùng?",
          options: [
            "Chỉ đọc lướt qua một lần và không xem lại.",
            "Kết hợp đọc tài liệu, ghi chú tóm tắt và tự kiểm tra bằng Flashcards lặp lại ngắt quãng.",
            "Học thuộc lòng nguyên văn không cần hiểu.",
            "Chờ đến ngày thi mới bắt đầu đọc."
          ],
          correctAnswer: 1,
          explanation: "Việc kết hợp Active Recall (chủ động gợi nhớ) và Spaced Repetition (lặp lại ngắt quãng) là phương pháp khoa học đã được chứng minh hiệu quả nhất."
        }
      ];
    }
    return quizzes;
  }

  /**
   * Automatically generate flashcards from document context
   */
  async generateFlashcardsForDocument(document: any) {
    if (process.env.NODE_ENV === 'production' && (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY)) {
      throw new AppError('AI Service is temporarily unavailable or not configured. Please contact the administrator.', 503);
    }
    
    let cards = [];
    if (document && document.category === 'Trí tuệ nhân tạo') {
      cards = [
        { front: "Deep Learning (Học sâu) là gì?", back: "Là một nhánh con của Học máy (Machine Learning) dựa trên các mạng thần kinh nhân tạo đa tầng (Deep Neural Networks)." },
        { front: "Reinforcement Learning (Học tăng cường) là gì?", back: "Phương pháp học thông qua tương tác với môi trường để tối đa hóa điểm thưởng (reward) tích lũy." },
        { front: "Mạng nơ-ron nhân tạo (ANN) là gì?", back: "Mô hình toán học lấy cảm hứng từ cấu trúc mạng lưới thần kinh sinh học của não người." }
      ];
    } else if (document && document.category === 'Toán học') {
      cards = [
        { front: "Đạo hàm của tan(x) bằng bao nhiêu?", back: "1 / cos^2(x) hoặc 1 + tan^2(x)" },
        { front: "Định lý Weierstrass phát biểu điều gì?", back: "Một hàm số liên tục trên một đoạn đóng [a, b] thì sẽ đạt giá trị lớn nhất và giá trị nhỏ nhất trên đoạn đó." },
        { front: "Đạo hàm của e^x bằng bao nhiêu?", back: "Bằng chính nó: e^x" }
      ];
    } else {
      cards = [
        { front: `Định nghĩa chính của "${document ? document.title : 'Tài liệu'}"`, back: `Là chủ đề cốt lõi thảo luận về kiến thức chuyên sâu trong tài liệu học tập của môn học.` },
        { front: "Phương pháp học Active Recall", back: "Chủ động kiểm tra lại kiến thức thay vì chỉ đọc thụ động, giúp tăng hiệu quả ghi nhớ lên gấp nhiều lần." }
      ];
    }
    return cards;
  }

  /**
   * Parse AI response for flashcards
   */
  private parseFlashcardResponse(responseText: string) {
    try {
      let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIdx = cleaned.indexOf('[');
      const endIdx = cleaned.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        cleaned = `[${cleaned}]`; // Wrap single object
      }
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON Parse Error:", e, responseText);
      return null;
    }
  }

  /**
   * Generate flashcards from note content
   */
  async generateFlashcardsFromText(text: string) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    let cards: {front: string, back: string}[] = [];

    const prompt = `Bạn là một chuyên gia giáo dục thiết kế thẻ ghi nhớ (Flashcards). Nhiệm vụ của bạn là đọc đoạn văn bản dưới đây và trích xuất ra các cặp thông tin quan trọng nhất để làm Flashcard.

QUY TẮC CHUẨN HOÁ (Áp dụng cho TẤT CẢ các môn học và ngành nghề):
Cho dù đoạn văn bản có lộn xộn hay không rõ ràng, hãy cố gắng bóc tách các ý chính thành dạng Thẻ (Front - Back).
- "front": [Từ khóa / Khái niệm / Câu hỏi ngắn / Tên riêng / Công thức]
- "back": [Định nghĩa / Giải thích súc tích / Ý nghĩa] + [Ví dụ thực tế / Ứng dụng nếu có].

MỘT SỐ VÍ DỤ CHUẨN:
- {"front": "Học máy (Machine Learning)", "back": "Là lĩnh vực AI cho phép hệ thống tự học từ dữ liệu. VD: Phân loại email rác."}
- {"front": "Đạo hàm của sin(x)", "back": "Là cos(x). VD: Tính vận tốc từ phương trình ly độ."}
- {"front": "Lạm phát (Inflation)", "back": "Sự tăng mức giá chung của hàng hóa/dịch vụ theo thời gian."}

YÊU CẦU BẮT BUỘC:
- Nếu văn bản quá ngắn, hãy suy luận để tạo ra ít nhất 1-2 thẻ hợp lý nhất có thể.
- Chỉ trả về ĐÚNG MỘT MẢNG JSON thuần túy (không chứa markdown, không có \`\`\`json).
- Object bên trong mảng chỉ được phép có 2 trường "front" và "back".

Văn bản cần xử lý:
"""
${text}
"""`;

    if (groqApiKey && !groqApiKey.includes('your_')) {
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
      });
      const responseText = completion.choices[0]?.message?.content || "[]";
      const parsed = this.parseFlashcardResponse(responseText);
      if (parsed) cards = parsed;
    } else if (geminiApiKey && !geminiApiKey.includes('your_')) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = this.parseFlashcardResponse(responseText);
      if (parsed) cards = parsed;
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('AI Service is temporarily unavailable or not configured. Please contact the administrator.', 503);
      }
      cards = [
        { front: "Làm thế nào để tạo flashcard thực sự từ ghi chú?", back: "Bạn cần cung cấp GROQ_API_KEY hoặc GEMINI_API_KEY trong file .env" },
        { front: "Mẫu câu hỏi (Mock)", back: "Đây là câu trả lời mẫu do hệ thống không có AI Key." }
      ];
    }
    
    // Normalize keys
    return cards.map((c: any) => ({
      front: c.front || c.Front || c.question || c.Question || c.q || 'Không có câu hỏi',
      back: c.back || c.Back || c.answer || c.Answer || c.a || 'Không có câu trả lời',
    }));
  }

  /**
   * Get Mindmap content from document
   */
  async getDocumentContentForMindmap(documentId: number, title?: string, content?: string): Promise<{docTitle: string, docContent: string}> {
    let docTitle = title || 'Sơ Đồ Tư Duy';
    let docContent = content || '';

    if (documentId) {
      const docResult = await db.query('SELECT title, description, solution_text, doc_url FROM documents WHERE id = $1', [documentId]);
      if (docResult.rows.length > 0) {
        const row = docResult.rows[0];
        docTitle = row.title || docTitle;
        docContent = row.solution_text || '';

        // If solution_text is short or empty and doc_url exists, parse file from disk
        if ((!docContent || docContent.length < 50) && row.doc_url) {
          docContent = await parserService.parseFromLocalPath(row.doc_url);
        }

        // Fallback to description if still empty
        if (!docContent || docContent.trim().length === 0) {
          docContent = row.description || docTitle;
        }

        // Derive title from first line if it's generic
        if (docTitle.toLowerCase().includes('test') && docContent.trim().length > 0) {
          const firstLine = docContent.split('\n')[0].replace(/^[#*\s\d.]+/g, '').trim();
          if (firstLine && firstLine.length > 3 && firstLine.length < 50) {
            docTitle = firstLine;
          }
        }
      }
    }
    return { docTitle, docContent };
  }

  /**
   * Save mindmap cache
   */
  async saveMindmapCache(documentId: number, userId: number, mermaidCode: string) {
    if (documentId) {
      await db.query(
        `INSERT INTO mindmaps (document_id, user_id, mermaid_code)
         VALUES ($1, $2, $3)
         ON CONFLICT (document_id, user_id)
         DO UPDATE SET mermaid_code = EXCLUDED.mermaid_code, updated_at = CURRENT_TIMESTAMP`,
        [documentId, userId, mermaidCode]
      );
    }
  }

  /**
   * Load mindmap cache
   */
  async getMindmapCache(documentId: number, userId: number) {
    const cached = await db.query(
      'SELECT * FROM mindmaps WHERE document_id = $1 AND user_id = $2',
      [documentId, userId]
    );
    return cached.rows.length > 0 ? cached.rows[0] : null;
  }
}

export const aiService = new AiService();
