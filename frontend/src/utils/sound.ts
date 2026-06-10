// Web Audio API helper for synthesizer-based sound effects without requiring audio file assets.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

function playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Resume context if suspended (browser security policy)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Smooth gain envelope to avoid clicking
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.error("Audio error:", error);
  }
}

export function playFlipSound(muted: boolean) {
  if (muted) return;
  // Soft, short click/tick
  playTone(800, "sine", 0.05, 0.05);
}

export function playSuccessSound(muted: boolean) {
  if (muted) return;
  // Pleasant rising chime
  const ctx = getAudioContext();
  if (!ctx) return;
  
  playTone(523.25, "sine", 0.15, 0.08); // C5
  setTimeout(() => {
    playTone(659.25, "sine", 0.2, 0.08); // E5
  }, 80);
}

export function playHardSound(muted: boolean) {
  if (muted) return;
  // Low pitch simple indicator
  playTone(220, "triangle", 0.2, 0.1); // A3
}

export function playCompleteSound(muted: boolean) {
  if (muted) return;
  // Happy arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, "sine", 0.3, 0.08);
    }, idx * 100);
  });
}
