import { describe, expect, it } from "vitest";

import {
  matchesSearch,
  normalizePersian,
  toPersianDigits,
  type AdmissionRecord,
} from "./admissions";

const record: AdmissionRecord = {
  id: "test",
  year: 1404,
  quota: "region-1",
  rank: 3,
  major: "پزشکی",
  university: "دانشگاه علوم پزشکی تهران",
  source: "test",
};

describe("Persian admission search helpers", () => {
  it("normalizes Arabic yeh/kaf and whitespace", () => {
    expect(normalizePersian("  پزشكي   ")).toBe("پزشکی");
  });

  it("matches both major and university", () => {
    expect(
      matchesSearch(record, "both", "پزشكي", "علوم پزشكي تهران"),
    ).toBe(true);
  });

  it("formats interface digits in Persian", () => {
    expect(toPersianDigits(1404)).toBe("۱۴۰۴");
  });
});
