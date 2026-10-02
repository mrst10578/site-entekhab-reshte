"use client";

type SafariWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let activeContext: AudioContext | null = null;
let stopTimer: number | null = null;

function stopActiveSiren() {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }

  if (activeContext) {
    void activeContext.close().catch(() => undefined);
    activeContext = null;
  }
}

function scheduleSweep(
  oscillator: OscillatorNode,
  startTime: number,
  duration: number,
  low: number,
  high: number,
  period: number,
) {
  let cursor = startTime;
  let rising = true;

  oscillator.frequency.setValueAtTime(low, cursor);

  while (cursor < startTime + duration) {
    const next = Math.min(cursor + period / 2, startTime + duration);
    oscillator.frequency.linearRampToValueAtTime(rising ? high : low, next);
    rising = !rising;
    cursor = next;
  }
}

export function playProtocol25Siren() {
  if (typeof window === "undefined") return;

  stopActiveSiren();

  const AudioContextConstructor =
    window.AudioContext ??
    (window as SafariWindow).webkitAudioContext;

  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  activeContext = context;

  const now = context.currentTime;
  const duration = 5.2;

  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();

  compressor.threshold.setValueAtTime(-18, now);
  compressor.knee.setValueAtTime(18, now);
  compressor.ratio.setValueAtTime(7, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.16, now);

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.045);

  // Controlled warning pulses. Loud enough to register, soft enough not to jump-scare.
  for (let cursor = now + 0.05; cursor < now + duration - 0.28; cursor += 0.36) {
    master.gain.setValueAtTime(0.16, cursor);
    master.gain.exponentialRampToValueAtTime(
      0.085,
      Math.min(cursor + 0.18, now + duration - 0.28),
    );
    master.gain.exponentialRampToValueAtTime(
      0.16,
      Math.min(cursor + 0.34, now + duration - 0.28),
    );
  }

  master.gain.cancelScheduledValues(now + duration - 0.24);
  master.gain.setValueAtTime(0.13, now + duration - 0.24);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  master.connect(compressor);
  compressor.connect(context.destination);

  const upper = context.createOscillator();
  upper.type = "triangle";
  const upperGain = context.createGain();
  upperGain.gain.setValueAtTime(0.72, now);
  scheduleSweep(upper, now, duration, 520, 830, 1.35);
  upper.connect(upperGain);
  upperGain.connect(master);

  const lower = context.createOscillator();
  lower.type = "sine";
  const lowerGain = context.createGain();
  lowerGain.gain.setValueAtTime(0.38, now);
  scheduleSweep(lower, now, duration, 385, 610, 1.35);
  lower.connect(lowerGain);
  lowerGain.connect(master);

  const sub = context.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(72, now);
  const subGain = context.createGain();
  subGain.gain.setValueAtTime(0.14, now);
  sub.connect(subGain);
  subGain.connect(master);

  upper.start(now);
  lower.start(now);
  sub.start(now);

  upper.stop(now + duration);
  lower.stop(now + duration);
  sub.stop(now + duration);

  void context.resume().catch(() => undefined);

  stopTimer = window.setTimeout(() => {
    if (activeContext === context) {
      void context.close().catch(() => undefined);
      activeContext = null;
    }
    stopTimer = null;
  }, Math.ceil((duration + 0.4) * 1000));
}

export function stopProtocol25Siren() {
  if (typeof window === "undefined") return;
  stopActiveSiren();
}
