# Hướng dẫn Triển khai Tính năng Text-to-Speech (TTS) Đa Ngôn Ngữ cho Flashcard

Chào bạn, đây là tài liệu thiết kế và bộ mã nguồn hoàn chỉnh để tích hợp tính năng Phát âm thanh (TTS) chuyên nghiệp như Quizlet vào dự án Cognito của bạn.

Dựa trên yêu cầu của bạn, tôi đề xuất phân tích 2 phương án trước khi đi vào code chi tiết:

### Phân tích 2 Phương án Triển khai

| Tiêu chí | Phương án 1: Web Speech API (Frontend) | Phương án 2: Google Cloud TTS (Backend) |
| :--- | :--- | :--- |
| **Chi phí** | Hoàn toàn MIỄN PHÍ. | Có phí (Google tính phí theo số lượng ký tự, tuy nhiên có free quota hàng tháng khá lớn). |
| **Độ chân thực của giọng đọc** | Phụ thuộc 100% vào hệ điều hành/trình duyệt của User. MacOS/iOS có giọng rất hay, nhưng Windows cũ thì giọng khá tệ (giống robot). | Giọng đọc AI tự nhiên, mượt mà, đồng nhất trên mọi thiết bị (có cả giọng Wavenet/Neural2 rất giống người thật). |
| **Tốc độ/Độ trễ** | Tức thì (phát ngay lập tức không cần tải mạng). | Có độ trễ nhẹ lần đầu (phải gọi API tải file mp3). Từ lần thứ 2 sẽ tức thì nếu đã cache. |
| **Vấn đề tiếng Nhật (Kanji)** | Web Speech API gặp khó khăn khi đọc Kanji đứng độc lập (vì không hiểu ngữ cảnh). Thường phải dùng Hiragana hint. | Google Cloud TTS phân tích ngữ cảnh tốt hơn, nhưng tốt nhất vẫn nên gửi kèm Furigana/Hiragana để đảm bảo độ chính xác 100%. |

> **Khuyến nghị:** Đối với dự án Startup/Học tập ở giai đoạn đầu, bạn nên **ưu tiên dùng Phương án 1 (Web Speech API)** để tiết kiệm chi phí server và triển khai cực nhanh. Sau này khi có User trả phí, bạn có thể nâng cấp lên Phương án 2 (Google TTS) làm tính năng Premium. Do đó, tài liệu này sẽ hướng dẫn xây dựng cấu trúc nền tảng cho cả 2, nhưng tập trung logic Frontend linh hoạt để sau này có thể "gắn" phương án 2 vào dễ dàng.

---

## PHẦN 1: THIẾT KẾ DATABASE (PostgreSQL)

Chúng ta cần cập nhật bảng `decks` để lưu trữ ngôn ngữ mặc định của bộ thẻ, và tạo bảng `audio_cache` (nếu dùng phương án 2).

Tạo file migration mới bằng lệnh: `npm run migrate:create -- add-tts-support`

Nội dung file migration:
```javascript
exports.up = (pgm) => {
  // 1. Thêm cột ngôn ngữ vào bảng decks
  pgm.addColumns('decks', {
    front_lang: { type: 'varchar(10)', default: "'en-US'" },
    back_lang: { type: 'varchar(10)', default: "'vi-VN'" },
  });

  // 2. [Chỉ dùng cho Phương án 2] Tạo bảng lưu cache Audio
  pgm.createTable('audio_cache', {
    id: 'id',
    text_hash: { type: 'varchar(255)', notNull: true, unique: true }, // Mã băm của chuỗi "lang + text"
    lang: { type: 'varchar(10)', notNull: true },
    text: { type: 'text', notNull: true },
    audio_url: { type: 'varchar(500)', notNull: true }, // Đường dẫn file trên S3/Cloudinary hoặc file server
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
  
  // Đánh index để truy vấn nhanh
  pgm.createIndex('audio_cache', 'text_hash');
};

exports.down = (pgm) => {
  pgm.dropTable('audio_cache');
  pgm.dropColumns('decks', ['front_lang', 'back_lang']);
};
```

---

## PHẦN 2: LOGIC BACKEND (Node.js/Express)

### 1. API Cập nhật ngôn ngữ cho Bộ thẻ (Deck)
Trong file `src/controllers/deckController.ts` hoặc router của bạn:

```typescript
import { Request, Response } from 'express';
import pool from '../config/db'; // Đường dẫn tới file config DB của bạn

export const updateDeckLanguages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { frontLang, backLang } = req.body;

  try {
    const result = await pool.query(
      `UPDATE decks 
       SET front_lang = $1, back_lang = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [frontLang || 'en-US', backLang || 'vi-VN', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json({ message: 'Languages updated', deck: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};
```

### 2. API Lấy Audio (Dành cho Phương án 2 - Google TTS)
Nếu bạn triển khai Phương án 2, đây là sườn logic xử lý:

```typescript
import crypto from 'crypto';
import textToSpeech from '@google-cloud/text-to-speech'; // Cần cài đặt thư viện này

const client = new textToSpeech.TextToSpeechClient();

export const getAudioForText = async (req: Request, res: Response) => {
  const { text, lang } = req.query;
  
  if (!text || !lang) return res.status(400).json({ error: 'Missing text or lang' });

  // 1. Tạo mã hash để check cache
  const textHash = crypto.createHash('md5').update(`${lang}_${text}`).digest('hex');

  try {
    // 2. Kiểm tra cache trong Database
    const cacheCheck = await pool.query('SELECT audio_url FROM audio_cache WHERE text_hash = $1', [textHash]);
    if (cacheCheck.rows.length > 0) {
      return res.json({ audioUrl: cacheCheck.rows[0].audio_url, cached: true });
    }

    // 3. Nếu chưa có, gọi Google TTS API
    const request = {
      input: { text: String(text) },
      voice: { languageCode: String(lang), name: `${lang}-Standard-A` }, // Có thể tuỳ biến giọng nam/nữ
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // 4. Lưu file audioContent lên Cloudinary / AWS S3 / Local storage
    // Giả sử bạn có hàm uploadToStorage(buffer) trả về URL
    const fileUrl = await uploadToStorage(audioContent, `${textHash}.mp3`); 

    // 5. Lưu vào cache DB
    await pool.query(
      'INSERT INTO audio_cache (text_hash, lang, text, audio_url) VALUES ($1, $2, $3, $4)',
      [textHash, lang, text, fileUrl]
    );

    res.json({ audioUrl: fileUrl, cached: false });
  } catch (error) {
    res.status(500).json({ error: 'TTS Generation failed' });
  }
};
```

---

## PHẦN 3: GIAO DIỆN & LOGIC FRONTEND (React)

### 1. Custom Hook `useTextToSpeech`
Tạo file `src/hooks/useTextToSpeech.ts`. Hook này bao bọc Web Speech API một cách an toàn và xử lý lỗi ngầm.

```typescript
import { useState, useEffect, useCallback } from 'react';

interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Tải danh sách giọng đọc sẵn có của trình duyệt
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string, options?: TTSOptions) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Browser does not support Speech Synthesis');
      return;
    }

    window.speechSynthesis.cancel(); // Dừng câu đang đọc (nếu có)
    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang || 'en-US';
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;

    // Tìm giọng bản xứ (Native voice) cho ngôn ngữ (Đặc biệt hữu ích cho Tiếng Nhật/Trung)
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => v.lang === utterance.lang || v.lang.startsWith(utterance.lang.split('-')[0]));
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  return { speak, stop, isPlaying };
}
```

### 2. Component `AudioButton`
Tạo file `src/components/flashcards/AudioButton.tsx`. Nó chứa hiệu ứng sóng âm (wave) khi đang đọc.

```tsx
import React, { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioButtonProps {
  isPlaying: boolean;
  onClick: (e: React.MouseEvent) => void;
  dark?: boolean;
}

export default function AudioButton({ isPlaying, onClick, dark = false }: AudioButtonProps) {
  // Bỏ focus sau khi click để tránh lỗi nhấn phím Space bị lặp lại nút này
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick(e);
    e.currentTarget.blur();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
        dark 
          ? 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300' 
          : 'bg-[#f0f0ec] hover:bg-[#e2e2dd] text-gray-600'
      } ${isPlaying ? 'text-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}`}
      title="Phát âm (Phím tắt: V)"
    >
      {isPlaying ? (
        <div className="flex items-end justify-center gap-0.5 h-4 w-4">
          <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 bg-[#10b981] rounded-full" />
          <motion.div animate={{ height: ["70%", "30%", "70%"] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1 bg-[#10b981] rounded-full" />
          <motion.div animate={{ height: ["100%", "50%", "100%"] }} transition={{ duration: 0.7, repeat: Infinity }} className="w-1 bg-[#10b981] rounded-full" />
        </div>
      ) : (
        <Volume2 size={18} />
      )}
    </button>
  );
}
```

### 3. Tích hợp vào `StudyView` (page.tsx)
Đây là cách ráp nối Auto-play và Keyboard Shortcut vào màn hình Flashcard chính.

```tsx
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import AudioButton from '@/components/flashcards/AudioButton';

export function StudyView({ cards, dark, ... }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const { speak, stop, isPlaying } = useTextToSpeech();

  // Giả sử lấy từ Context/LocalStorage, ở đây fix cứng để ví dụ
  const autoPlayAudio = true; 
  const frontLang = 'en-US';
  const backLang = 'vi-VN';

  // Hàm phát âm hiện tại
  const playCurrentCardAudio = useCallback(() => {
    if (!card) return;
    const textToSpeak = flipped ? card.back : card.front;
    const lang = flipped ? backLang : frontLang;
    
    speak(textToSpeak, { lang });
  }, [card, flipped, frontLang, backLang, speak]);

  // Xử lý Phím tắt (Phím V để nghe)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ vào input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === 'KeyV') {
        e.preventDefault();
        playCurrentCardAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playCurrentCardAudio]);

  // Logic Auto-play khi chuyển thẻ hoặc lật thẻ
  useEffect(() => {
    if (autoPlayAudio) {
      playCurrentCardAudio();
    }
  }, [index, flipped]); // Kích hoạt lại mỗi khi index (qua thẻ) hoặc flipped (lật thẻ) thay đổi

  // ... Render ...
  return (
    <div>
       {/* Card Container */}
       <div className="relative ...">
          <div className="absolute top-4 right-4 z-20">
             <AudioButton 
                isPlaying={isPlaying} 
                onClick={(e) => { e.stopPropagation(); playCurrentCardAudio(); }} 
                dark={dark} 
             />
          </div>
          
          {/* Nội dung thẻ */}
          <div className="text-center">{flipped ? card.back : card.front}</div>
       </div>
    </div>
  )
}
```

---

## Mẹo xử lý tiếng Nhật (Phát âm đúng Kanji)
Nếu dùng Web Speech API ở Frontend, Kanji có thể bị đọc sai vì TTS của OS không hiểu ngữ cảnh (VD: `今日` đọc là `kyou` hay `konnichi`). 
**Giải pháp tốt nhất ở Frontend:** 
Bắt buộc người dùng lưu thẻ theo format: `Front: 今日 [kyou]` hoặc tách thành trường `hint`. Trước khi truyền vào hàm `speak()`, bạn viết logic bóc tách lấy nội dung trong ngoặc `[]` để đưa vào máy đọc:

```javascript
const sanitizeTextForTTS = (text) => {
  // Tìm chữ trong ngoặc vuông (nếu có) và chỉ đọc nó
  const match = text.match(/\[(.*?)\]/);
  return match ? match[1] : text; 
}
// Gọi: speak(sanitizeTextForTTS(card.front), { lang: 'ja-JP' })
```
Làm như vậy, người dùng Cognito sẽ có trải nghiệm học Kanji cực kỳ chuẩn xác và linh hoạt.
