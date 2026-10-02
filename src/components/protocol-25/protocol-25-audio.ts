"use client";

type SafariWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export const PROTOCOL_25_SIREN_START_KEY = "protocol25-siren-started-at";
export const PROTOCOL_25_SIREN_PERIOD_MS = 14_000;

let activeContext: AudioContext | null = null;
let resumeInteractionCleanup: (() => void) | null = null;

function clearResumeInteraction() {
  resumeInteractionCleanup?.();
  resumeInteractionCleanup = null;
}

function stopActiveSiren() {
  clearResumeInteraction();

  if (activeContext) {
    void activeContext.close().catch(() => undefined);
    activeContext = null;
  }
}

function readSirenStart() {
  try {
    const value = Number(sessionStorage.getItem(PROTOCOL_25_SIREN_START_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeSirenStart(startedAt: number) {
  try {
    sessionStorage.setItem(PROTOCOL_25_SIREN_START_KEY, String(startedAt));
  } catch {
    // The siren still works for the current page when tab storage is blocked.
  }
}

export function getProtocol25SirenPhase(
  startedAt: number,
  now = Date.now(),
  periodMs = PROTOCOL_25_SIREN_PERIOD_MS,
) {
  const elapsed = Math.max(0, now - startedAt);
  const offset = elapsed % periodMs;
  return (offset / periodMs) * Math.PI * 2;
}

function createSweepLfo(
  context: AudioContext,
  frequency: number,
  depth: number,
  target: AudioParam,
  phaseRadians = 0,
  startAtTrough = false,
) {
  const lfo = context.createOscillator();
  const depthGain = context.createGain();

  if (startAtTrough) {
    // -cos(phase): trough at 0s, exact crest at 7s, trough again at 14s.
    // The phase offset lets a refreshed page resume at the matching point in
    // the 14-second cycle instead of restarting from the beginning.
    const real = new Float32Array([0, -Math.cos(phaseRadians)]);
    const imag = new Float32Array([0, Math.sin(phaseRadians)]);
    lfo.setPeriodicWave(
      context.createPeriodicWave(real, imag, { disableNormalization: true }),
    );
  } else if (phaseRadians !== 0) {
    // sin(theta + phase) = sin(theta)cos(phase) + cos(theta)sin(phase)
    const real = new Float32Array([0, Math.sin(phaseRadians)]);
    const imag = new Float32Array([0, Math.cos(phaseRadians)]);
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

function armResumeOnInteraction(startedAt: number) {
  if (resumeInteractionCleanup) return;

  const resume = () => {
    clearResumeInteraction();
    startSiren(startedAt);
  };

  const options: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener("pointerdown", resume, options);
  window.addEventListener("touchstart", resume, options);
  window.addEventListener("keydown", resume, { capture: true });

  resumeInteractionCleanup = () => {
    window.removeEventListener("pointerdown", resume, true);
    window.removeEventListener("touchstart", resume, true);
    window.removeEventListener("keydown", resume, true);
  };
}

function startSiren(startedAt: number) {
  stopActiveSiren();

  const AudioContextConstructor =
    window.AudioContext ??
    (window as SafariWindow).webkitAudioContext;

  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  activeContext = context;

  const now = context.currentTime;
  const sweepPeriodSeconds = PROTOCOL_25_SIREN_PERIOD_MS / 1000;
  const sweepFrequency = 1 / sweepPeriodSeconds;
  const sweepPhase = getProtocol25SirenPhase(startedAt);

  const rotationPeriodMs = 5_800;
  const rotationPhase = getProtocol25SirenPhase(
    startedAt,
    Date.now(),
    rotationPeriodMs,
  );

  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const output = context.createGain();

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

  const upper = context.createOscillator();
  upper.type = "sawtooth";
  upper.frequency.setValueAtTime(635, now);
  const upperGain = context.createGain();
  upperGain.gain.setValueAtTime(0.5, now);
  upper.connect(upperGain);
  upperGain.connect(master);

  const lower = context.createOscillator();
  lower.type = "triangle";
  lower.frequency.setValueAtTime(455, now);
  const lowerGain = context.createGain();
  lowerGain.gain.setValueAtTime(0.46, now);
  lower.connect(lowerGain);
  lowerGain.connect(master);

  const sub = context.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(92, now);
  const subGain = context.createGain();
  subGain.gain.setValueAtTime(0.16, now);
  sub.connect(subGain);
  subGain.connect(master);

  createSweepLfo(
    context,
    sweepFrequency,
    305,
    upper.frequency,
    sweepPhase,
    true,
  );
  createSweepLfo(
    context,
    sweepFrequency,
    210,
    lower.frequency,
    sweepPhase,
    true,
  );

  createSweepLfo(
    context,
    1 / 5.8,
    0.09,
    master.gain,
    rotationPhase,
  );

  upper.start(now);
  lower.start(now);
  sub.start(now);

  // A reload destroys the old AudioContext, so a literally gapless reload is
  // impossible. We recreate the siren at the matching cycle phase. Browsers
  // may still suspend audio started without a fresh user gesture; if that
  // happens, the first tap/key press recreates it at the then-current phase.
  void context.resume().catch(() => undefined);

  if (context.state !== "running") {
    armResumeOnInteraction(startedAt);
  }
}

export function playProtocol25Siren() {
  if (typeof window === "undefined") return;

  const startedAt = Date.now();
  writeSirenStart(startedAt);
  startSiren(startedAt);
}

export function resumeProtocol25SirenFromSession() {
  if (typeof window === "undefined") return false;

  const startedAt = readSirenStart();
  if (!startedAt) return false;

  startSiren(startedAt);
  return true;
}

export function stopProtocol25Siren() {
  if (typeof window === "undefined") return;
  stopActiveSiren();
}
