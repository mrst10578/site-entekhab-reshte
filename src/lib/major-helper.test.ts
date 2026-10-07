import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Row = {
  code: string;
  university: string;
  course_type: string;
  gender: string;
  capacity: string;
  description: string;
};
type Manifest = {
  totalMajors: number;
  totalRows: number;
  majors: Record<string, { file: string; rows: number }>;
};

describe("1405 major helper data integrity", () => {
  it("splits the source into valid shards without losing or duplicating codes", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "public/major-helper/manifest.json"), "utf8"),
    ) as Manifest;

    expect(manifest.totalMajors).toBe(299);
    expect(manifest.totalRows).toBe(18680);

    const cache = new Map<string, Record<string, Row[]>>();
    const codes = new Set<string>();
    let records = 0;
    for (const [major, entry] of Object.entries(manifest.majors)) {
      expect(entry.file).toMatch(/^\/major-helper\/data\/part-\d{2}\.json$/);
      if (!cache.has(entry.file)) {
        const text = readFileSync(join(process.cwd(), "public", entry.file.slice(1)), "utf8");
        expect(text.length).toBeLessThan(400_000);
        cache.set(entry.file, JSON.parse(text) as Record<string, Row[]>);
      }
      const rows = cache.get(entry.file)?.[major];
      expect(rows).toBeDefined();
      expect(rows?.length).toBe(entry.rows);

      for (const row of rows ?? []) {
        expect(row.code).toMatch(/^\d+$/);
        expect(codes.has(row.code), "Duplicate code " + row.code).toBe(false);
        codes.add(row.code);
        expect(typeof row.university).toBe("string");
        expect(typeof row.course_type).toBe("string");
        expect(typeof row.gender).toBe("string");
        expect(typeof row.capacity).toBe("string");
        expect(typeof row.description).toBe("string");
        records++;
      }
    }
    expect(cache.size).toBe(12);
    expect(records).toBe(manifest.totalRows);
  });
});
