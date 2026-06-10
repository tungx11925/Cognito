export function findBestVoice(voices: SpeechSynthesisVoice[], lang: 'vi-VN' | 'en-US', preferredGender?: 'male' | 'female'): SpeechSynthesisVoice | null {
  const isVietnamese = lang === 'vi-VN';
  
  const validVoices = voices.filter(v => v.lang.toLowerCase().includes(isVietnamese ? 'vi' : 'en'));
  
  if (validVoices.length === 0) {
    // Fallback: any voice starting with the language code
    const fallback = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    return fallback || null;
  }

  const scoredVoices = validVoices.map(voice => {
    let score = 0;
    const nameLower = voice.name.toLowerCase();
    
    if (isVietnamese) {
      if (nameLower.includes('google')) score = 100;
      else if (nameLower.includes('hoaimy')) score = 95;
      else if (nameLower.includes('an') && nameLower.includes('microsoft')) score = 90;
      else score = 50; // generic vi-VN
      
      // Gender heuristics for Vietnamese
      const isFemale = nameLower.includes('hoaimy') || nameLower.includes('tiếng việt'); // Google VN is female
      const isMale = nameLower.includes('an') || nameLower.includes('namminh');
      
      if (preferredGender === 'female' && isFemale) score += 50;
      if (preferredGender === 'male' && isMale) score += 50;
      
    } else {
      // English
      if (nameLower === 'google us english') score = 100;
      else if (nameLower === 'google uk english female') score = 95;
      else if (nameLower.includes('aria')) score = 90;
      else if (nameLower.includes('jenny')) score = 85;
      else score = 50; // generic en-US
      
      // Gender heuristics for English
      const isFemale = nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('aria') || nameLower.includes('jenny');
      const isMale = nameLower.includes('male') && !nameLower.includes('female') || nameLower.includes('david') || nameLower.includes('guy');
      
      if (preferredGender === 'female' && isFemale) score += 50;
      if (preferredGender === 'male' && isMale) score += 50;
    }
    
    return { voice, score };
  });

  scoredVoices.sort((a, b) => b.score - a.score);
  
  const bestVoice = scoredVoices[0].voice;
  console.log(`[TTS Debug] Selected Voice for ${lang}:`, bestVoice.name);
  
  return bestVoice;
}
