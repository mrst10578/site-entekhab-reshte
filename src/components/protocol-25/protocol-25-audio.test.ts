import { describe, expect, it } from "vitest";

import {
  getProtocol25SirenPhase,
  PROTOCOL_25_SIREN_PERIOD_MS,
} from "./protocol-25-audio";

describe("Protocol 25 siren phase", () => {
  it("starts low, peaks at seven seconds, and loops at fourteen seconds", () => {
    const startedAt = 1_000;

    expect(getProtocol25SirenPhase(startedAt, startedAt)).toBeCloseTo(0);
    expect(
      getProtocol25SirenPhase(startedAt, startedAt + 7_000),
    ).toBeCloseTo(Math.PI);
    expect(
      getProtocol25SirenPhase(
        startedAt,
        startedAt + PROTOCOL_25_SIREN_PERIOD_MS,
      ),
    ).toBeCloseTo(0);
  });

  it("restores the matching phase after a later refresh", () => {
    const startedAt = 20_000;
    const beforeRefresh = getProtocol25SirenPhase(startedAt, startedAt + 9_250);
    const afterRefresh = getProtocol25SirenPhase(startedAt, startedAt + 9_250);

    expect(afterRefresh).toBeCloseTo(beforeRefresh);
  });
});
