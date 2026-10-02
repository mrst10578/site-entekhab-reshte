"use client";

type SafariWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let activeContext: AudioContext | null = null;

function stopActiveSiren() {
  if (activeContext) {
    void activeContext.close().catch(() => undefined);
    activeContext = null;
  }
}

function createSweepLfo(
  context: AudioContext,
  frequency: number,
  depth: number,
  target: AudioParam,
) {
  const lfo = context.createOscillator();
  const depthGain = context.createGain();

  lfo.type = "sine";
  lfo.frequency.value = frequency;
  depthGain.gain.value = depth;

  lfo.connect(depthGain);
  depthGain.connect(target);
  lfo.start();

  return lfo;
}

export function playProtocol25Siren() {
  if (typeof window === "undefined") return;

  // A second click must never stack another siren on top of the first one.
  stopActiveSiren();

  const AudioContextConstructor =
    window.AudioContext ??
    (window as SafariWindow).webkitAudioContext;

  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  activeContext = context;

  const now = context.currentTime;

  // Long, mechanical civil-defense-style cycle: roughly 24 seconds for one
  // complete rise-and-fall sweep, then it repeats continuously without a seam.
  const sweepPeriodSeconds = 24;
  const sweepFrequency = 1 / sweepPeriodSeconds;

  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const output = context.createGain();

  // Keep the synthesized signal very close to the digital ceiling while using
  // strong compression to avoid hard clipping when the harmonics overlap.
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.74, now + 0.08);

  compressor.threshold.setValueAtTime(-12, now);
  compressor.knee.setValueAtTime(5, now);
  compressor.ratio.setValueAtTime(14, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.18, now);

  output.gain.setValueAtTime(0.98, now);

  master.connect(compressor);
  compressor.connect(output);
  output.connect(context.destination);

  // Main upper siren voice.
  const upper = context.createOscillator();
  upper.type = "sawtooth";
  upper.frequency.setValueAtTime(610, now);
  const upperGain = context.createGain();
  upperGain.gain.setValueAtTime(0.5, now);
  upper.connect(upperGain);
  upperGain.connect(master);

  // Lower coupled siren voice gives the alarm a heavier, older mechanical body.
  const lower = context.createOscillator();
  lower.type = "triangle";
  lower.frequency.setValueAtTime(440, now);
  const lowerGain = context.createGain();
  lowerGain.gain.setValueAtTime(0.46, now);
  lower.connect(lowerGain);
  lowerGain.connect(master);

  // Low mechanical undertone.
  const sub = context.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(92, now);
  const subGain = context.createGain();
  subGain.gain.setValueAtTime(0.16, now);
  sub.connect(subGain);
  subGain.connect(master);

  // The two siren voices share the same very slow 24-second sweep so each
  // audible cycle feels long instead of behaving like a short repeating beep.
  createSweepLfo(context, sweepFrequency, 300, upper.frequency);
  createSweepLfo(context, sweepFrequency, 205, lower.frequency);

  // A shallow amplitude pulse adds the impression of a rotating mechanical
  // siren without turning the alarm into a rapid modern electronic beeper.
  createSweepLfo(context, 1 / 5.8, 0.09, master.gain);

  upper.start(now);
  lower.start(now);
  sub.start(now);

  // Intentionally no stop time: once triggered by the user's quota-25 click,
  // the siren loops for the lifetime of this page until explicitly stopped,
  // reloaded, or the tab is closed.
  void context.resume().catch(() => undefined);
}

export function stopProtocol25Siren() {
  if (typeof window === "undefined") return;
  stopActiveSiren();
}
