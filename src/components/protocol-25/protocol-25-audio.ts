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
  startAtTrough = false,
) {
  const lfo = context.createOscillator();
  const depthGain = context.createGain();

  if (startAtTrough) {
    // -cos(phase): starts at the lowest point, reaches the highest point
    // exactly halfway through the cycle, then returns seamlessly.
    const real = new Float32Array([0, -1]);
    const imag = new Float32Array(2);
    lfo.setPeriodicWave(
      context.createPeriodicWave(real, imag, { disableNormalization: true }),
    );
  } else {
    lfo.type = "sine";
  }

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

  // One complete rise-and-fall cycle is 14 seconds. The custom sweep waveform
  // starts at the trough, reaches its exact peak at 7 seconds, then returns to
  // the trough at 14 seconds before repeating seamlessly.
  const sweepPeriodSeconds = 14;
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
  upper.frequency.setValueAtTime(635, now);
  const upperGain = context.createGain();
  upperGain.gain.setValueAtTime(0.5, now);
  upper.connect(upperGain);
  upperGain.connect(master);

  // Lower coupled siren voice gives the alarm a heavier, older mechanical body.
  const lower = context.createOscillator();
  lower.type = "triangle";
  lower.frequency.setValueAtTime(455, now);
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

  // Both voices start at their low point, crest together at second 7, and
  // return to the starting pitch at second 14. The slightly raised centers
  // make the alarm only a little sharper than the previous version.
  createSweepLfo(context, sweepFrequency, 305, upper.frequency, true);
  createSweepLfo(context, sweepFrequency, 210, lower.frequency, true);

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
