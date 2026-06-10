import { TextSegment } from './detectLanguageSegment';
import { findBestVoice } from './findBestVoice';

export interface TTSConfig {
  rate: number;
  pitch: number;
  gender?: 'male' | 'female';
}

export function playSegments(
  segments: TextSegment[],
  voices: SpeechSynthesisVoice[],
  config: TTSConfig,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (e: any) => void
) {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  if (segments.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  let currentIndex = 0;
  let isCancelled = false;

  const playNext = () => {
    if (isCancelled || currentIndex >= segments.length) {
      if (!isCancelled && onEnd) onEnd();
      return;
    }

    const segment = segments[currentIndex];
    // Skip empty segments
    if (!segment.text.trim()) {
      currentIndex++;
      playNext();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(segment.text);
    
    // Apply configuration
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    
    // Select the best voice for the segment's language
    const bestVoice = findBestVoice(voices, segment.lang, config.gender);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.lang = segment.lang;
    }

    if (currentIndex === 0 && onStart) {
      onStart();
    }

    utterance.onend = () => {
      currentIndex++;
      // Add a tiny delay between segments for natural pacing
      setTimeout(() => {
        playNext();
      }, 50);
    };

    utterance.onerror = (e) => {
      console.error('[TTS Debug] Error playing segment:', segment.text, e);
      // If error occurs, attempt to continue to next segment
      currentIndex++;
      playNext();
    };

    console.log(`[TTS Debug] Speaking (${segment.lang}):`, segment.text);
    window.speechSynthesis.speak(utterance);
  };

  playNext();

  return () => {
    isCancelled = true;
    window.speechSynthesis.cancel();
  };
}
