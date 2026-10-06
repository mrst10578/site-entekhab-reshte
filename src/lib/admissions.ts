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

const MAJOR_ADMISSION_SUFFIX =
  /\s*-\s*(?=(?:روزانه|شبانه|نوبت|غیرانتفاعی|پیام\s*نور|فرهنگیان|آزاد|محروم|بومی|نیمسال|مشترک|پذیرش|کاردانی|کارشناسی|ظرفیت|محل\s*خدمت)).*$/;

const MAJOR_KEY_ALIASES: Record<string, string> = {
  "تکنولوژیاتاقعمل": "اتاقعمل",
  "تکنولوژیپرتوشناسی": "پرتوشناسی",
  "دکترایعمومیدامپزشکی": "دامپزشکی",
  "ساختپروتزهایدندانی": "پروتزدندان",
  "فوریتهایپزشکیپیشبیمارستانی": "فوریتهایپزشکی",
  "ارتوزوپروتزاعضایمصنوعیووسایلکمکی": "اعضایمصنوعیووسایلکمکی",
  "مددکاریاجتماعیویژهوزارتبهداشت": "مددکاریاجتماعی",
};

function compactMajorName(value: string) {
  return normalizePersian(value)
    .replace(/[أإٱآ]/g, "ا")
    .replace(/[ۀة]/g, "ه")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(MAJOR_ADMISSION_SUFFIX, "")
    .replace(/\s*\/\s*ویژه\s+وزارت\s+بهداشت\s*\/?\s*$/, " ویژه وزارت بهداشت")
    .replace(/[()（）\[\]{}،,:؛;.!?؟"'«»/\\_\-–—\s]/g, "");
}

export function majorSearchKey(value: string) {
  const key = compactMajorName(value);
  return MAJOR_KEY_ALIASES[key] ?? key;
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
  const major = majorSearchKey(record.major);
  const university = normalizePersian(record.university);
  const requestedMajor = majorSearchKey(majorQuery);
  const requestedUniversity = normalizePersian(universityQuery);

  if (mode === "major") {
    return !requestedMajor || major === requestedMajor;
  }

  if (mode === "university") {
    return !requestedUniversity || university.includes(requestedUniversity);
  }

  return (
    (!requestedMajor || major === requestedMajor) &&
    (!requestedUniversity || university.includes(requestedUniversity))
  );
}
