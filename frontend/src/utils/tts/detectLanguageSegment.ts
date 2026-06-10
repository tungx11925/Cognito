export interface TextSegment {
  text: string;
  lang: 'vi-VN' | 'en-US';
}

const TECH_TERMS = new Set([
  'react', 'javascript', 'js', 'nodejs', 'node', 'mongodb', 'typescript', 'ts', 
  'api', 'backend', 'frontend', 'database', 'hook', 'state', 'props', 'component',
  'html', 'css', 'web', 'app', 'framework', 'library', 'server', 'client',
  'code', 'bug', 'debug', 'developer', 'software', 'system'
]);

const VIETNAMESE_CHARS_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

function isEnglishWord(word: string): boolean {
  const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (!cleanWord) return false;
  
  if (TECH_TERMS.has(cleanWord)) return true;
  
  if (VIETNAMESE_CHARS_REGEX.test(word)) return false;

  return false;
}

export function detectLanguageSegment(text: string): TextSegment[] {
  console.log('[TTS Debug] Parsing text:', text);
  
  // Split by words and non-words keeping both
  const tokens = text.match(/[\wÀ-ỹ]+|[^\wÀ-ỹ]+/g) || [];
  
  const segments: TextSegment[] = [];
  let currentLang: 'vi-VN' | 'en-US' | null = null;
  let currentBuffer = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // If it's punctuation or space, append to current buffer
    if (/^[^\wÀ-ỹ]+$/.test(token)) {
      currentBuffer += token;
      continue;
    }

    let wordLang: 'vi-VN' | 'en-US' = 'vi-VN';
    
    if (isEnglishWord(token)) {
      wordLang = 'en-US';
    } else if (VIETNAMESE_CHARS_REGEX.test(token)) {
      wordLang = 'vi-VN';
    } else {
      // It's a word without special chars (e.g. "Xin"). Guess from context
      let nextHasVietnamese = false;
      for (let j = i + 1; j < tokens.length && j < i + 5; j++) {
        if (VIETNAMESE_CHARS_REGEX.test(tokens[j])) {
          nextHasVietnamese = true;
          break;
        }
      }
      
      let prevWasVietnamese = currentLang === 'vi-VN';
      
      if (nextHasVietnamese || prevWasVietnamese) {
        wordLang = 'vi-VN';
      } else {
        wordLang = 'en-US';
      }
    }

    if (currentLang === null) {
      currentLang = wordLang;
      currentBuffer += token;
    } else if (currentLang === wordLang) {
      currentBuffer += token;
    } else {
      // Language switched
      if (currentBuffer.trim()) {
        segments.push({ text: currentBuffer, lang: currentLang });
      } else if (segments.length > 0) {
        segments[segments.length - 1].text += currentBuffer;
      }
      currentBuffer = token;
      currentLang = wordLang;
    }
  }

  if (currentBuffer && currentLang) {
    if (currentBuffer.trim() || segments.length === 0) {
        segments.push({ text: currentBuffer, lang: currentLang });
    } else if (segments.length > 0) {
        segments[segments.length - 1].text += currentBuffer;
    }
  }

  console.log('[TTS Debug] Segments:', segments);
  return segments;
}
