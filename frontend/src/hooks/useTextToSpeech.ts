import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { detectLanguageSegment } from '@/utils/tts/detectLanguageSegment';
import { playSegments, TTSConfig } from '@/utils/tts/speakQueue';
import { resetSpeechEngine } from '@/utils/tts/resetSpeechEngine';

export enum VoiceStyle {
  Soft = 'Soft',
  Normal = 'Normal',
  Professional = 'Professional',
  Teacher = 'Teacher'
}

export interface UserTTSSettings {
  gender: 'male' | 'female';
  style: VoiceStyle;
}

const STYLE_PRESETS: Record<VoiceStyle, { rate: number; pitch: number }> = {
  [VoiceStyle.Soft]: { rate: 0.85, pitch: 1.05 },
  [VoiceStyle.Normal]: { rate: 0.95, pitch: 1.0 },
  [VoiceStyle.Professional]: { rate: 1.0, pitch: 0.95 },
  [VoiceStyle.Teacher]: { rate: 0.9, pitch: 1.1 }
};

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  // Default to Normal, female if not set
  const [settings, setSettings] = useState<UserTTSSettings>({
    gender: 'female',
    style: VoiceStyle.Normal
  });

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const cancelCurrentRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 1. Load settings from localStorage
    const savedGender = localStorage.getItem('tts_gender') as 'male' | 'female';
    const savedStyle = localStorage.getItem('tts_style') as VoiceStyle;
    
    if (savedGender || savedStyle) {
      setSettings(prev => ({
        gender: savedGender || prev.gender,
        style: savedStyle || prev.style
      }));
    }

    // 2. Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        voicesRef.current = availableVoices;
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserTTSSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('tts_gender', updated.gender);
      localStorage.setItem('tts_style', updated.style);
      return updated;
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Browser does not support Web Speech API.');
      return;
    }
    
    if (!text || text.trim() === '') return;

    // Handle Furigana removal in brackets
    const match = text.match(/\[(.*?)\]/);
    const sanitizedText = match ? match[1] : text;

    await resetSpeechEngine();

    // Cancel previous queue
    if (cancelCurrentRef.current) {
      cancelCurrentRef.current();
    }

    // Split text into bilingual segments
    const segments = detectLanguageSegment(sanitizedText);
    
    // Get preset tone/rate from settings
    const preset = STYLE_PRESETS[settings.style];
    const config: TTSConfig = {
      rate: preset.rate,
      pitch: preset.pitch,
      gender: settings.gender
    };

    // Start speaking queue
    const cancelFn = playSegments(
      segments,
      voicesRef.current,
      config,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      (e) => {
        console.error('Speech error', e);
        setIsPlaying(false);
      }
    );

    cancelCurrentRef.current = cancelFn || null;

  }, [voicesLoaded, settings]);

  const stop = useCallback(() => {
    if (cancelCurrentRef.current) {
      cancelCurrentRef.current();
      cancelCurrentRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  return { speak, stop, isPlaying, settings, updateSettings };
}
