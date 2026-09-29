// An original eight-note ambient composition synthesized locally. No audio assets.
export function startOriginalMelody(context: AudioContext) {
  const notes = [261.63, 329.63, 392, 349.23, 293.66, 329.63, 261.63, 392];
  const output = context.createGain();
  output.gain.value = 0.14;
  output.connect(context.destination);
  let nextStart = context.currentTime + 0.05;

  function schedulePhrase() {
    notes.forEach((frequency, index) => {
      const start = nextStart + index * 0.75;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.28, start + 0.04);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + 1.8);
      oscillator.connect(envelope);
      envelope.connect(output);
      oscillator.start(start);
      oscillator.stop(start + 1.85);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    });
    nextStart += 8 * 0.75;
  }

  schedulePhrase();
  const timer = window.setInterval(() => {
    if (context.state === "running" && nextStart < context.currentTime + 1) {
      nextStart = Math.max(nextStart, context.currentTime + 0.05);
      schedulePhrase();
    }
  }, 500);
  return () => {
    window.clearInterval(timer);
    output.disconnect();
  };
}
