import { AppError } from './AppError';

/**
 * Unified Prompt Injection Detection Patterns (Bilingual: English + Vietnamese)
 * Covers:
 * - Jailbreak / DAN exploits
 * - Role reassignment / Persona hijacking
 * - System prompt exfiltration
 * - Delimiter / Markdown / Role escapes
 */
export const INJECTION_PATTERNS = [
  // English jailbreak & override
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /bypass\s+(all\s+)?(safety|system|security)\s+(rules?|restrictions?|filters?)/i,
  /jailbreak/i,
  /\bDAN\s+mode\b/i,
  /\bdeveloper\s+mode\b/i,
  /\bdo\s+anything\s+now\b/i,
  /you\s+are\s+now\s+(an?\s+)?(unrestricted|evil|dan|developer|system|admin|free)/i,
  /act\s+as\s+(an?\s+)?(unrestricted|evil|dan|developer|system|admin)/i,

  // Vietnamese jailbreak & override
  /bỏ\s*qua\s+(hết\s+|tất\s*cả\s+)?(các\s+)?(chỉ\s*dẫn|hướng\s*dẫn|quy\s*tắc|câu\s*lệnh)/i,
  /qua\s+mặt\s+(các\s+)?quy\s+tắc/i,
  /quên\s+(hết|tất\s+cả)\s+(các\s+)?(lệnh|quy\s+tắc|chỉ\s+dẫn)/i,
  /không\s+cần\s+tuân\s+thủ\s+(quy\s+tắc|luật)/i,
  /đóng\s+vai\s+(hệ\s+thống|quản\s+trị|admin|root|hacker|trợ\s+lý\s+không\s+giới\s+hạn)/i,
  /đổi\s+vai\s+trò/i,
  /chế\s+độ\s+(nhà\s+phát\s+triển|developer)/i,

  // System prompt exfiltration (English & Vietnamese)
  /reveal\s+(the\s+)?(system|initial|original|hidden)\s+(prompt|instructions?|rules?)/i,
  /show\s+(me\s+)?(the\s+)?(system|initial|original|hidden)\s+(prompt|instructions?|rules?)/i,
  /print\s+(the\s+)?(system|initial|original|hidden)\s+(prompt|instructions?|rules?)/i,
  /display\s+(the\s+)?(system|initial|original|hidden)\s+(prompt|instructions?|rules?)/i,
  /what\s+(is|are)\s+your\s+(initial|system|original|true)\s+(instructions?|prompt|rules?)/i,
  /trích\s+xuất\s+(câu\s+lệnh|chỉ\s+dẫn|prompt)\s+(gốc|hệ\s+thống|ban\s+đầu)/i,
  /in\s+(ra\s+)?(toàn\s+bộ\s+)?(câu\s+lệnh|chỉ\s+dẫn|prompt)\s+(gốc|hệ\s+thống|ban\s+đầu)/i,
  /hiển\s+thị\s+(toàn\s+bộ\s+)?(chỉ\s+dẫn|prompt)\s+(gốc|hệ\s+thống|ban\s+đầu)/i,
  /cho\s+tôi\s+(xem|biết)\s+(system\s+prompt|prompt|chỉ\s+dẫn|câu\s+lệnh)\s*(gốc|hệ\s+thống|ban\s+đầu)?/i,

  // Role delimiter escaping
  /```\s*(system|instruction|admin)/i,
  /<\s*\|\s*im_start\s*\|/i,
  /<\s*\|\s*im_end\s*\|/i,
  /<\s*\|\s*endoftext\s*\|/i,
  /\[\s*system\s*\]/i,
  /\[SYSTEM_PROMPT\]/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\s*script/i,
];

/**
 * Thẩm định và làm sạch chỉ dẫn tùy biến của người dùng.
 * Áp dụng thống nhất cho cả AI Chat (Phase 5) và Question Generation (Phase 6/27).
 * - Cắt tỉa độ dài (mặc định 500 ký tự cho customInstruction, 4000 cho chat).
 * - Chặn 100% các payload Prompt Injection song ngữ.
 */
export function sanitizeUserInstruction(raw?: string | null, maxLength = 500): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.length > maxLength) {
    throw new AppError(`Chỉ dẫn tùy chỉnh không được vượt quá ${maxLength} ký tự`, 400);
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new AppError(
        'Chỉ dẫn tùy chỉnh chứa nội dung không an toàn hoặc cố gắng ghi đè hệ thống (Prompt Injection detected). Vui lòng điều chỉnh lại câu hỏi học tập.',
        400,
        'PROMPT_INJECTION_DETECTED'
      );
    }
  }

  return trimmed;
}

/**
 * Bọc chỉ dẫn người dùng trong rào phân cách (System Boundary Fencing).
 * Chỉ dẫn AI coi dữ liệu bên trong là nội dung xử lý, không phải lệnh điều khiển hệ thống.
 */
export function wrapInstructionBoundary(instruction: string): string {
  const cleaned = instruction.replace(/\[\/?USER_INSTRUCTION_(START|END)\]/g, '');
  return `[USER_INSTRUCTION_START]\n${cleaned}\n[USER_INSTRUCTION_END]`;
}
