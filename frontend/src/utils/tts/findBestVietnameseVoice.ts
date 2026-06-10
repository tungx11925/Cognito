/**
 * Thuật toán chấm điểm và tìm kiếm giọng Tiếng Việt tốt nhất.
 * Cấm hoàn toàn việc dùng giọng Tiếng Anh (tránh nói lơ lớ).
 */

export function findBestVietnameseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Danh sách các từ khóa tiếng Anh cần loại bỏ (Blacklist)
  const englishBlacklist = ['en-US', 'en-GB', 'en-AU', 'English', 'Google US English', 'Microsoft David', 'Microsoft Zira'];
  
  // Lọc bỏ tất cả những voice nằm trong Blacklist
  const validVoices = voices.filter(v => {
    return !englishBlacklist.some(blacklisted => 
      v.lang.toLowerCase().includes(blacklisted.toLowerCase()) ||
      v.name.toLowerCase().includes(blacklisted.toLowerCase())
    );
  });

  if (validVoices.length === 0) return null;

  // Thuật toán chấm điểm
  const scoredVoices = validVoices.map(voice => {
    let score = 0;
    const nameLower = voice.name.toLowerCase();
    const langLower = voice.lang.toLowerCase();

    // Priority 1 (Score: 200) - Microsoft Edge Natural Voices (Siêu việt trong việc đọc song ngữ Anh-Việt cùng 1 tone)
    if (nameLower.includes('natural') && nameLower.includes('vietnamese')) {
      score = 200;
    }
    // Priority 2 (Score: 150) - Microsoft An / HoaiMy (Bilingual support tốt)
    else if (nameLower.includes('microsoft') && (nameLower.includes('an') || nameLower.includes('hoaimy'))) {
      score = 150;
    }
    // Priority 3 (Score: 100) - Google Vietnamese (Đọc tiếng Anh khá ổn)
    else if (nameLower.includes('google') && (nameLower.includes('tiếng việt') || nameLower.includes('vietnamese') || langLower.includes('vi-vn'))) {
      score = 100;
    }
    // Priority 4 (Score: 90) - Giọng Nam Miền Bắc (Microsoft NamMinh)
    else if (nameLower.includes('namminh')) {
      score = 90;
    }
    // Priority 5 (Score: 80) - Apple Vietnamese Voices
    else if (nameLower.includes('linh') || nameLower === 'vietnamese' || (nameLower.includes('apple') && langLower === 'vi-vn')) {
      score = 80;
    }
    // Priority 4 (Score: 80) - Bất kỳ voice nào lang là vi-VN chính xác
    else if (langLower === 'vi-vn') {
      score = 80;
    }
    // Priority 5 (Score: 70) - Bất kỳ voice nào lang bắt đầu bằng vi
    else if (langLower.startsWith('vi')) {
      score = 70;
    }

    return { voice, score };
  });

  // Lọc ra những voice có điểm > 0 (Có nghĩa là được xác định là giọng tiếng Việt)
  const vietnameseVoices = scoredVoices.filter(item => item.score > 0);

  // Debug log để dễ theo dõi rank
  console.table(
    voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default
    }))
  );

  if (vietnameseVoices.length === 0) {
    return null; // Không tìm thấy bất kỳ giọng Tiếng Việt nào
  }

  // Sắp xếp theo điểm giảm dần và lấy voice cao điểm nhất
  vietnameseVoices.sort((a, b) => b.score - a.score);
  
  const bestVoice = vietnameseVoices[0].voice;
  
  console.log('[TTS] Selected Voice:', bestVoice.name, bestVoice.lang, '| Score:', vietnameseVoices[0].score);

  return bestVoice;
}
