import { describe, expect, it } from "vitest";

import {
  majorSearchKey,
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

  it("treats spelling and spacing variants of the same major as one major", () => {
    expect(majorSearchKey("روان‌شناسی")).toBe(majorSearchKey("روانشناسی"));
    expect(majorSearchKey("آمار")).toBe(majorSearchKey("امار"));
    expect(majorSearchKey("علوم آزمایشگاهی")).toBe(
      majorSearchKey("علوم ازمایشگاهی"),
    );
  });

  it("folds admission suffixes into the base major without broad fuzzy matching", () => {
    expect(majorSearchKey("پزشکی - نیمسال اول")).toBe(majorSearchKey("پزشکی"));
    expect(majorSearchKey("مهندسی پزشکی")).not.toBe(majorSearchKey("پزشکی"));
  });

  it("supports curated historical names for the same major", () => {
    expect(majorSearchKey("تکنولوژی اتاق عمل")).toBe(majorSearchKey("اتاق عمل"));
    expect(majorSearchKey("دکترای عمومی دامپزشکی")).toBe(
      majorSearchKey("دامپزشکی"),
    );
    expect(majorSearchKey("ساخت پروتزهای دندانی")).toBe(
      majorSearchKey("پروتز دندان"),
    );
  });

  it("formats interface digits in Persian", () => {
    expect(toPersianDigits(1404)).toBe("۱۴۰۴");
  });
});
