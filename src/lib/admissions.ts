export const YEARS = Array.from({ length: 17 }, (_, index) => 1404 - index);

export const QUOTAS = [
  { key: "region-1", label: "منطقه ۱" },
  { key: "region-2", label: "منطقه ۲" },
  { key: "region-3", label: "منطقه ۳" },
  { key: "quota-5", label: "۵ درصد" },
  { key: "quota-25", label: "۲۵ درصد" },
] as const;

export type QuotaKey = (typeof QUOTAS)[number]["key"];
export type SearchMode = "major" | "university" | "both";

export interface AdmissionRecord {
  id: string;
  year: number;
  quota: QuotaKey;
  rank: number;
  major: string;
  university: string;
  admissionType?: string;
  group?: string;
  source: string;
}

export function normalizePersian(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa");
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function isSearchMode(value: string | null): value is SearchMode {
  return value === "major" || value === "university" || value === "both";
}

export function matchesSearch(
  record: AdmissionRecord,
  mode: SearchMode,
  majorQuery: string,
  universityQuery: string,
) {
  const major = normalizePersian(record.major);
  const university = normalizePersian(record.university);
  const requestedMajor = normalizePersian(majorQuery);
  const requestedUniversity = normalizePersian(universityQuery);

  if (mode === "major") {
    return !requestedMajor || major.includes(requestedMajor);
  }

  if (mode === "university") {
    return !requestedUniversity || university.includes(requestedUniversity);
  }

  return (
    (!requestedMajor || major.includes(requestedMajor)) &&
    (!requestedUniversity || university.includes(requestedUniversity))
  );
}
