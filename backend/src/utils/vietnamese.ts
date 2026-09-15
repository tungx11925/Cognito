/**
 * Vietnamese Text & Font Normalization Utilities
 * Fixes Unicode NFD/NFC decomposition, combining accents, and PDF extraction artifacts.
 */

const DIACRITIC_MAP: Record<string, string> = {
  // Grave accent (dấu huyền)
  'a`': 'à', 'ă`': 'ằ', 'â`': 'ầ', 'e`': 'è', 'ê`': 'ề', 'i`': 'ì', 'o`': 'ò', 'ô`': 'ồ', 'ơ`': 'ờ', 'u`': 'ù', 'ư`': 'ừ', 'y`': 'ỳ',
  'A`': 'À', 'Ă`': 'Ằ', 'Â`': 'Ầ', 'E`': 'È', 'Ê`': 'Ề', 'I`': 'Ì', 'O`': 'Ò', 'Ô`': 'Ồ', 'Ơ`': 'Ờ', 'U`': 'Ù', 'Ư`': 'Ừ', 'Y`': 'Ỳ',
  
  // Acute accent (dấu sắc)
  'a´': 'á', 'ă´': 'ắ', 'â´': 'ấ', 'e´': 'é', 'ê´': 'ế', 'i´': 'í', 'o´': 'ó', 'ô´': 'ố', 'ơ´': 'ớ', 'u´': 'ú', 'ư´': 'ứ', 'y´': 'ý',
  'A´': 'Á', 'Ă´': 'Ắ', 'Â´': 'Ấ', 'E´': 'É', 'Ê´': 'Ế', 'I´': 'Í', 'O´': 'Ó', 'Ô´': 'Ố', 'Ơ´': 'Ớ', 'U´': 'Ú', 'Ư´': 'Ứ', 'Y´': 'Ý',
  'a\'': 'á', 'ă\'': 'ắ', 'â\'': 'ấ', 'e\'': 'é', 'ê\'': 'ế', 'i\'': 'í', 'o\'': 'ó', 'ô\'': 'ố', 'ơ\'': 'ớ', 'u\'': 'ú', 'ư\'': 'ứ', 'y\'': 'ý',
  
  // Tilde accent (dấu ngã)
  'a~': 'ã', 'ă~': 'ẵ', 'â~': 'ẫ', 'e~': 'ẽ', 'ê~': 'ễ', 'i~': 'ĩ', 'o~': 'õ', 'ô~': 'ỗ', 'ơ~': 'ỡ', 'u~': 'ũ', 'ư~': 'ữ', 'y~': 'ỹ',
  'A~': 'Ã', 'Ă~': 'Ẵ', 'Â~': 'Ẫ', 'E~': 'Ẽ', 'Ê~': 'Ễ', 'I~': 'Ĩ', 'O~': 'Õ', 'Ô~': 'Ỗ', 'Ơ~': 'Ỡ', 'U~': 'Ũ', 'Ư~': 'Ữ', 'Y~': 'Ỹ',

  // Combining diacritics (Unicode combining marks \u0300 - \u0323)
  'a\u0300': 'à', 'a\u0301': 'á', 'a\u0303': 'ã', 'a\u0309': 'ả', 'a\u0323': 'ạ',
  'ă\u0300': 'ằ', 'ă\u0301': 'ắ', 'ă\u0303': 'ẵ', 'ă\u0309': 'ẳ', 'ă\u0323': 'ặ',
  'â\u0300': 'ầ', 'â\u0301': 'ấ', 'â\u0303': 'ẫ', 'â\u0309': 'ẩ', 'â\u0323': 'ậ',
  'e\u0300': 'è', 'e\u0301': 'é', 'e\u0303': 'ẽ', 'e\u0309': 'ẻ', 'e\u0323': 'ẹ',
  'ê\u0300': 'ề', 'ê\u0301': 'ế', 'ê\u0303': 'ễ', 'ê\u0309': 'ể', 'ê\u0323': 'ệ',
  'i\u0300': 'ì', 'i\u0301': 'í', 'i\u0303': 'ĩ', 'i\u0309': 'ỉ', 'i\u0323': 'ị',
  'o\u0300': 'ò', 'o\u0301': 'ó', 'o\u0303': 'õ', 'o\u0309': 'ỏ', 'o\u0323': 'ọ',
  'ô\u0300': 'ồ', 'ô\u0301': 'ố', 'ô\u0303': 'ỗ', 'ô\u0309': 'ổ', 'ô\u0323': 'ộ',
  'ơ\u0300': 'ờ', 'ơ\u0301': 'ớ', 'ơ\u0303': 'ỡ', 'ơ\u0309': 'ở', 'ơ\u0323': 'ợ',
  'u\u0300': 'ù', 'u\u0301': 'ú', 'u\u0303': 'ũ', 'u\u0309': 'ủ', 'u\u0323': 'ụ',
  'ư\u0300': 'ừ', 'ư\u0301': 'ứ', 'ư\u0303': 'ữ', 'ư\u0309': 'ử', 'ư\u0323': 'ự',
  'y\u0300': 'ỳ', 'y\u0301': 'ý', 'y\u0303': 'ỹ', 'y\u0309': 'ỷ', 'y\u0323': 'ỵ',
};

/**
 * Normalizes Vietnamese string to standard precomposed Unicode (NFC)
 * and repairs common PDF/OCR artifact patterns.
 */
export function cleanVietnameseText(input: string | null | undefined): string {
  if (!input) return '';
  
  let result = input.normalize('NFC');

  // Replace common decomposed patterns (e.g. "vê`" -> "về", "vê `" -> "về")
  result = result.replace(/([aăâeêioôơuưyAĂÂEÊIOÔƠUƯY])\s*[`´’]/g, (match, char) => {
    const keyGrave = `${char}\``;
    const keyAcute = `${char}´`;
    return DIACRITIC_MAP[keyGrave] || DIACRITIC_MAP[keyAcute] || match;
  });

  // Apply explicit character map replacements
  for (const [pattern, replacement] of Object.entries(DIACRITIC_MAP)) {
    if (result.includes(pattern)) {
      result = result.split(pattern).join(replacement);
    }
  }

  // Remove zero-width spaces and broken control characters
  result = result
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .normalize('NFC');

  return result;
}
