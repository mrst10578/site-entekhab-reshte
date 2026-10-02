import { afterEach, describe, expect, it, vi } from "vitest";

import {
  incrementProtocol25RefreshCount, isProtocol25Locked, lockProtocol25Session,
  PROTOCOL_25_LOCK_KEY, PROTOCOL_25_REFRESH_COUNT_KEY,
  scheduleProtocol25, type Protocol25Frame,
} from "./sequence";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Protocol 25 lifecycle", () => {
  it("keeps the security scan four seconds longer, then closes in 13.3 seconds", () => {
    vi.useFakeTimers();
    const frames: Protocol25Frame[] = [];
    scheduleProtocol25((frame) => frames.push(frame));
    vi.advanceTimersByTime(7849);
    expect(frames.at(-1)?.progress).toBe(86);
    vi.advanceTimersByTime(1);
    expect(frames.at(-1)).toMatchObject({ stage: "pause", progress: 100 });
    vi.advanceTimersByTime(400);
    expect(frames.at(-1)?.stage).toBe("flagged");
    vi.advanceTimersByTime(5050);
    expect(frames.filter((frame) => frame.stage === "countdown").map((frame) => frame.countdown)).toEqual(["03", "02", "01"]);
    expect(frames.at(-1)?.stage).toBe("terminated");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels every remaining transition when unmounted", () => {
    vi.useFakeTimers();
    const frames: Protocol25Frame[] = [];
    const cleanup = scheduleProtocol25((frame) => frames.push(frame));
    vi.advanceTimersByTime(1000);
    cleanup();
    const count = frames.length;
    vi.runAllTimers();
    expect(frames).toHaveLength(count);
    expect(frames.at(-1)?.stage).toBe("scan");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("persists the terminal lock in tab storage", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(isProtocol25Locked()).toBe(false);
    lockProtocol25Session();
    expect(values.get(PROTOCOL_25_LOCK_KEY)).toBe("1");
    expect(isProtocol25Locked()).toBe(true);
  });

  it("counts locked-page refreshes in tab storage", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });

    expect(incrementProtocol25RefreshCount()).toBe(1);
    expect(values.get(PROTOCOL_25_REFRESH_COUNT_KEY)).toBe("1");
    expect(incrementProtocol25RefreshCount()).toBe(2);
    expect(values.get(PROTOCOL_25_REFRESH_COUNT_KEY)).toBe("2");
  });

  it("does not crash when tab storage is blocked", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => { throw new DOMException("Blocked", "SecurityError"); },
      setItem: () => { throw new DOMException("Blocked", "SecurityError"); },
    });
    expect(isProtocol25Locked()).toBe(false);
    expect(() => lockProtocol25Session()).not.toThrow();
  });
});
