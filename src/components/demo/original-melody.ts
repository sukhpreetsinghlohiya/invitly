import type { MusicMood } from "@/types/invitation";

// Original synthesized phrases inspired by Indian timbres; no samples or quoted melodies.
// The audio engine is imported only after Play.
export function startOriginalMelody(context: AudioContext, mood: MusicMood = "santoor", volume = .5) {
  const output = context.createGain();
  output.gain.setValueAtTime(0, context.currentTime);
  output.gain.linearRampToValueAtTime(volume * .28, context.currentTime + .3);
  output.connect(context.destination);
  const beat = mood === "celebration" ? .36 : mood === "bansuri" ? .8 : .58;
  const phrases: Record<MusicMood, number[]> = {
    santoor: [0, 4, 7, 9, 7, 4, 2, 4, 7, 12, 9, 7, 4, 2, 0, 7],
    bansuri: [0, 2, 5, 7, 9, 7, 5, 2, 5, 7, 12, 9, 7, 5, 2, 0],
    celebration: [0, 4, 7, 12, 9, 7, 4, 7, 2, 5, 9, 12, 7, 4, 2, 0],
  };
  let nextStart = context.currentTime + .04;
  let stopped = false;
  const active = new Set<OscillatorNode>();
  function tone(frequency: number, start: number, duration: number, gain: number, soft = false) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = soft ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + (soft ? .12 : .012));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope); envelope.connect(output);
    oscillator.start(start); oscillator.stop(start + duration + .01); active.add(oscillator);
    oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  }
  function drum(start: number, high: boolean) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.frequency.setValueAtTime(high ? 230 : 120, start);
    oscillator.frequency.exponentialRampToValueAtTime(high ? 130 : 48, start + .11);
    envelope.gain.setValueAtTime(.3, start); envelope.gain.exponentialRampToValueAtTime(.0001, start + .23);
    oscillator.connect(envelope); envelope.connect(output); oscillator.start(start); oscillator.stop(start + .24); active.add(oscillator);
    oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  }
  function phrase() {
    phrases[mood].forEach((note, index) => {
      const start = nextStart + index * beat, frequency = 261.63 * 2 ** (note / 12);
      tone(frequency, start, mood === "bansuri" ? beat * 1.3 : beat * 2.3, .32, mood === "bansuri");
      if (mood === "santoor") tone(frequency * 2.01, start, .65, .055, true);
      if (mood === "celebration") drum(start, index % 4 !== 0);
    });
    tone(130.815, nextStart, beat * 16, .1, true);
    tone(196, nextStart, beat * 16, .055, true);
    nextStart += beat * 16;
  }
  phrase();
  const timer = window.setInterval(() => {
    if (!stopped && context.state === "running" && nextStart < context.currentTime + 1) {
      nextStart = Math.max(nextStart, context.currentTime + .04); phrase();
    }
  }, 250);
  return {
    setVolume(value: number) { output.gain.setTargetAtTime(Math.min(1, Math.max(0, value)) * .28, context.currentTime, .05); },
    stop() {
      if (stopped) return;
      stopped = true; window.clearInterval(timer);
      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setTargetAtTime(.0001, context.currentTime, .04);
      for (const oscillator of active) { try { oscillator.stop(context.currentTime + .18); } catch {} }
    },
  };
}
