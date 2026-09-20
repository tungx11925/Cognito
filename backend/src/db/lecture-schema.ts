import { db } from './index';

export async function bootstrapLectureSchema() {
  try {
    // 1. Create lectures table
    await db.query(`
      CREATE TABLE IF NOT EXISTS lectures (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) DEFAULT 'Khoa học máy tính',
        chapter_count INTEGER DEFAULT 1,
        total_slides INTEGER DEFAULT 0,
        cover_color VARCHAR(50) DEFAULT '#0B132B',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lecture_slides (
        id SERIAL PRIMARY KEY,
        lecture_id INTEGER REFERENCES lectures(id) ON DELETE CASCADE,
        slide_number INTEGER NOT NULL,
        chapter_index INTEGER DEFAULT 1,
        chapter_title VARCHAR(255) DEFAULT 'Chapter 1',
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        content TEXT NOT NULL,
        callout_type VARCHAR(50) DEFAULT 'definition',
        callout_title VARCHAR(255),
        callout_content TEXT,
        speaker_notes TEXT,
        page_number INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE lectures ADD COLUMN IF NOT EXISTS file_url TEXT;
      ALTER TABLE lectures ADD COLUMN IF NOT EXISTS presentation_mode VARCHAR(50) DEFAULT 'ORIGINAL';
      ALTER TABLE lectures ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);
      ALTER TABLE lecture_slides ADD COLUMN IF NOT EXISTS page_number INTEGER;
    `);

    // 2. Check if sample lecture exists, if not seed it for instant testing
    const countCheck = await db.query('SELECT COUNT(*) FROM lectures');
    if (parseInt(countCheck.rows[0].count, 10) === 0) {
      const lectureRes = await db.query(`
        INSERT INTO lectures (title, description, subject, chapter_count, total_slides, cover_color)
        VALUES (
          'Introduction to Machine Learning',
          'Giáo trình bài giảng Trí tuệ Nhân tạo & Học máy chuyên sâu dành cho Giảng viên',
          'Trí tuệ nhân tạo',
          3,
          24,
          '#0A1128'
        ) RETURNING id;
      `);

      const lectureId = lectureRes.rows[0].id;

      // Sample 24 slides seed
      const sampleSlides = [
        {
          slide_number: 1,
          chapter_index: 3,
          chapter_title: 'Chapter 3: Neural Networks',
          title: 'Chapter 3: Neural Networks and Deep Learning',
          subtitle: '3.1 INTRODUCTION',
          content: `A neural network is a computational model loosely inspired by the structure of biological neural networks in the brain. It consists of interconnected layers of nodes (neurons) that process information through weighted connections.

The fundamental building block of a neural network is the artificial neuron, which computes a weighted sum of its inputs and applies a non-linear activation function to produce its output. This allows networks to learn complex, non-linear relationships in data.`,
          callout_type: 'definition',
          callout_title: 'Definition',
          callout_content: 'A neural network is a function approximator that maps input data to output predictions through a series of learned transformations, represented as layers of parameterized operations.',
          speaker_notes: 'Nhấn mạnh sự khác biệt giữa mô hình tuyến tính truyền thống và mạng nơ-ron phi tuyến tính.'
        },
        {
          slide_number: 2,
          chapter_index: 3,
          chapter_title: 'Chapter 3: Neural Networks',
          title: 'Biological vs Artificial Neurons',
          subtitle: '3.2 BIOLOGICAL INSPIRATION',
          content: `In the human brain, neurons communicate via electrical signals across synapses. 

- **Dendrites**: Receive incoming signals from other neurons.
- **Soma (Cell body)**: Aggregates incoming potentials.
- **Axon**: Transmits the action potential once threshold is reached.
- **Synapses**: Weight the strength of interconnections.

In Artificial Neural Networks (ANN), this is modeled mathematically as $y = f(\\sum w_i x_i + b)$.`,
          callout_type: 'formula',
          callout_title: 'Mathematical Formulation',
          callout_content: 'y = \\sigma \\left( \\sum_{i=1}^n w_i x_i + b \\right) = \\sigma(\\mathbf{w}^T \\mathbf{x} + b)',
          speaker_notes: 'Giải thích ý nghĩa của trọng số w và độ lệch bias b.'
        },
        {
          slide_number: 3,
          chapter_index: 3,
          chapter_title: 'Chapter 3: Neural Networks',
          title: 'Activation Functions: Non-Linearity Engine (Part 1)',
          subtitle: '3.3 ACTIVATION FUNCTIONS',
          content: `Without non-linear activations, any multi-layer network collapses into a single linear map $W_2(W_1 x) = W x$.

- **ReLU (Rectified Linear Unit)**: $f(x) = \\max(0, x)$ — Fast computation, standard for hidden layers.
- **Sigmoid**: $\\sigma(x) = \\frac{1}{1 + e^{-x}}$ — Outputs binary probability range $(0, 1)$.`,
          callout_type: 'takeaway',
          callout_title: 'Key Takeaway',
          callout_content: 'ReLU is computationally cheap and avoids vanishing gradients for positive inputs.',
          speaker_notes: 'Vẽ đồ thị ReLU và so sánh hiện tượng bão hòa gradient của Sigmoid.'
        },
        {
          slide_number: 4,
          chapter_index: 3,
          chapter_title: 'Chapter 3: Neural Networks',
          title: 'Activation Functions: Non-Linearity Engine (Part 2)',
          subtitle: '3.3 ACTIVATION FUNCTIONS',
          content: `Advanced activation functions designed for modern deep architectures:

- **Softmax**: $\\sigma(\\mathbf{z})_i = \\frac{e^{z_i}}{\\sum e^{z_j}}$ — Multi-class probability distribution.
- **GELU / LeakyReLU**: Fixes the dying ReLU phenomenon in transformer architectures.`,
          callout_type: 'formula',
          callout_title: 'Softmax Formulation',
          callout_content: '\\sigma(\\mathbf{z})_i = \\frac{e^{z_i}}{\\sum_{j=1}^K e^{z_j}} \\quad \\text{for } i = 1, \\dots, K',
          speaker_notes: 'Nhấn mạnh Softmax dùng ở output layer cho bài toán phân loại đa lớp.'
        },
        {
          slide_number: 5,
          chapter_index: 3,
          chapter_title: 'Chapter 3: Neural Networks',
          title: 'Multi-Layer Perceptron (MLP) Architecture',
          subtitle: '3.4 LAYERED ARCHITECTURE',
          content: `An MLP is composed of three primary layer categories:

- **Input Layer**: Feature vectors $x \\in \\mathbb{R}^d$.
- **Hidden Layers**: Representations $h^{(l)} = g(W^{(l)} h^{(l-1)} + b^{(l)})$.
- **Output Layer**: Task-specific predictions (probabilities or continuous scalars).`,
          callout_type: 'definition',
          callout_title: 'Universal Approximation Theorem',
          callout_content: 'A feedforward network with a single hidden layer can approximate any continuous function on compact subsets of $\\mathbb{R}^n$.',
          speaker_notes: 'Giải thích định lý Cybenko (1989) & Hornik (1991).'
        }
      ];

      // Add remaining slides up to 24
      for (let i = 6; i <= 24; i++) {
        sampleSlides.push({
          slide_number: i,
          chapter_index: i <= 10 ? 3 : (i <= 18 ? 4 : 5),
          chapter_title: i <= 10 ? 'Chapter 3: Neural Networks' : (i <= 18 ? 'Chapter 4: Optimization & Backpropagation' : 'Chapter 5: Convolutional Networks (CNN)'),
          title: `Slide ${i}: Advanced Topic & Analysis (${i <= 10 ? 'Part 3' : (i <= 18 ? 'Part 4' : 'Part 5')})`,
          subtitle: `SECTION 3.${i}`,
          content: `Core principles of deep learning architectures and computational execution:

- Gradient formulation: $\\nabla_W \\mathcal{L} = \\frac{\\partial \\mathcal{L}}{\\partial \\hat{y}} \\frac{\\partial \\hat{y}}{\\partial z} \\frac{\\partial z}{\\partial W}$.
- Automatic differentiation via DAG computational graph.`,
          callout_type: i % 2 === 0 ? 'formula' : 'takeaway',
          callout_title: i % 2 === 0 ? 'Formula / Calculation' : 'Important Note',
          callout_content: `Key theoretical insight for slide ${i}. Ensure students understand intuitive mechanics.`,
          speaker_notes: `Ghi chú cho giảng viên tại slide số ${i}: Nhắc sinh viên làm bài lab thực hành.`
        });
      }

      for (const slide of sampleSlides) {
        await db.query(`
          INSERT INTO lecture_slides (
            lecture_id, slide_number, chapter_index, chapter_title, title, subtitle, content, callout_type, callout_title, callout_content, speaker_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          lectureId,
          slide.slide_number,
          slide.chapter_index,
          slide.chapter_title,
          slide.title,
          slide.subtitle,
          slide.content,
          slide.callout_type,
          slide.callout_title,
          slide.callout_content,
          slide.speaker_notes
        ]);
      }
    }
  } catch (error) {
    console.error('Error bootstrapping lecture schema:', error);
  }
}
