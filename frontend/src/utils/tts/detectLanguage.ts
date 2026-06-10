/**
 * Hàm phân tích và phát hiện xem văn bản có chứa ký tự Tiếng Việt hay không.
 * @param text Văn bản cần kiểm tra
 * @returns 'vi-VN' nếu là tiếng Việt, ngược lại trả về 'en-US' (hoặc ngôn ngữ khác nếu cần)
 */
export function detectLanguage(text: string): string {
  if (!text) return 'en-US';

  const normalizedText = text.toLowerCase();

  // Danh sách các ký tự đặc biệt và dấu của Tiếng Việt
  const vietnameseCharsRegex = /[ăâêôơưđáàảãạấầẩẫậếềểễệốồổỗộớờởỡợứừửữựíìỉĩịýỳỷỹỵ]/i;

  if (vietnameseCharsRegex.test(normalizedText)) {
    return 'vi-VN';
  }

  // Fallback mặc định là Tiếng Anh
  return 'en-US';
}
