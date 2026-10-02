export const PROTOCOL_25_LOCK_KEY = "protocol25-session-locked";

export type Protocol25Stage =
  | "init" | "anomaly" | "scan" | "pause" | "flagged"
  | "lockdown" | "countdown" | "eject" | "terminated";

export interface Protocol25Frame {
  stage: Protocol25Stage;
  progress: number;
  diagnostics: number;
  logs: number;
  countdown: string;
}

export const INITIAL_FRAME: Protocol25Frame = {
  stage: "init", progress: 0, diagnostics: 0, logs: 0, countdown: "03",
};

// Absolute milestones keep the entire sequence deterministic, including under
// reduced motion. CSS animation events never drive application state.
export const PROTOCOL_25_TIMELINE: ReadonlyArray<{
  at: number;
  frame: Partial<Protocol25Frame>;
}> = [
  { at: 350, frame: { stage: "anomaly" } },
  { at: 950, frame: { stage: "scan", diagnostics: 1 } },
  { at: 1400, frame: { diagnostics: 2 } },
  { at: 1800, frame: { diagnostics: 3 } },
  { at: 1950, frame: { progress: 12 } },
  { at: 2650, frame: { progress: 47 } },
  { at: 3350, frame: { progress: 86 } },
  { at: 3850, frame: { stage: "pause", progress: 100 } },
  { at: 4250, frame: { stage: "flagged" } },
  { at: 5400, frame: { stage: "lockdown", logs: 1 } },
  { at: 5900, frame: { logs: 2 } },
  { at: 6400, frame: { logs: 3 } },
  { at: 6900, frame: { stage: "countdown", countdown: "03" } },
  { at: 7500, frame: { countdown: "02" } },
  { at: 8100, frame: { countdown: "01" } },
  { at: 8700, frame: { stage: "eject" } },
  { at: 9300, frame: { stage: "terminated" } },
];

export function scheduleProtocol25(onFrame: (frame: Protocol25Frame) => void) {
  let current = INITIAL_FRAME;
  const timers = PROTOCOL_25_TIMELINE.map(({ at, frame }) =>
    setTimeout(() => {
      current = { ...current, ...frame };
      onFrame(current);
    }, at),
  );
  return () => timers.forEach(clearTimeout);
}

// Storage can be unavailable in privacy-restricted browsers. The theatrical
// sequence still finishes; only refresh persistence is unavailable in that case.
export function isProtocol25Locked() {
  try {
    return sessionStorage.getItem(PROTOCOL_25_LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function lockProtocol25Session() {
  try {
    sessionStorage.setItem(PROTOCOL_25_LOCK_KEY, "1");
  } catch {
    // Keep the final screen usable when browser storage is disabled.
  }
}
