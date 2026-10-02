"use client";

import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { MatrixRainBackground } from "@/components/matrix-rain-background";
import { Protocol25Screen } from "@/components/protocol-25/protocol-25-screen";
import { isProtocol25Locked } from "@/components/protocol-25/sequence";
import { admissionRecords as bootstrapRecords } from "@/data/admissions";
import {
  normalizePersian,
  QUOTAS,
  toPersianDigits,
  type AdmissionRecord,
  type QuotaKey,
  YEARS,
} from "@/lib/admissions";

interface DataShard {
  year: number;
  path: string;
  quota?: QuotaKey;
  format?: "json" | "csv";
}

interface DataIndex {
  version: number;
  sourceCommit?: string;
  years: number[];
  majors: string[];
  shards: DataShard[];
}

type ExamGroupKey =
  | "experimental"
  | "math"
  | "humanities"
  | "art"
  | "language"
  | "all";

type SelectedQuota = QuotaKey | "all";
type OnboardingPhase = "group" | "quota" | "loading" | "ready" | "error"
  | "protocol25-init" | "protocol25-terminated";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const EXAM_GROUPS: Array<{ key: ExamGroupKey; label: string }> = [
  { key: "experimental", label: "تجربی" },
  { key: "math", label: "ریاضی" },
  { key: "humanities", label: "انسانی" },
  { key: "art", label: "هنر" },
  { key: "language", label: "زبان" },
  { key: "all", label: "مشاهده همه" },
];

const GROUP_ALIASES: Record<Exclude<ExamGroupKey, "all">, string[]> = {
  experimental: ["تجربی", "علوم تجربی"],
  math: ["ریاضی", "ریاضی فیزیک", "علوم ریاضی"],
  humanities: ["انسانی", "علوم انسانی"],
  art: ["هنر"],
  language: ["زبان", "زبان خارجی", "زبان های خارجی", "زبان‌های خارجی"],
};

const FEATURED_YEARS = new Set([1404, 1403, 1402, 1401]);
const RESULT_BATCH = 80;
const SEARCH_TEMPORARILY_DISABLED = true;

function withBasePath(path: string) {
  if (!BASE_PATH) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

function recordIdentity(record: AdmissionRecord) {
  return [
    record.year,
    record.quota,
    record.rank,
    normalizePersian(record.major),
    normalizePersian(record.university),
    normalizePersian(record.admissionType ?? ""),
    normalizePersian(record.group ?? ""),
  ].join("|");
}

function mergeRecords(
  current: AdmissionRecord[],
  incoming: AdmissionRecord[],
) {
  const merged = new Map<string, AdmissionRecord>();

  for (const record of [...current, ...incoming]) {
    merged.set(recordIdentity(record), record);
  }

  return [...merged.values()];
}

function sortPersian(values: string[]) {
  return values.sort((a, b) => a.localeCompare(b, "fa"));
}

function uniqueValues(values: string[]) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const normalized = normalizePersian(value);
    if (normalized && !seen.has(normalized)) {
      seen.set(normalized, value);
    }
  }

  return sortPersian([...seen.values()]);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function legacyQuota(value: string): QuotaKey | null {
  const normalized = normalizePersian(value)
    .replace(/٪/g, "%")
    .replace(/یک/g, "1")
    .replace(/دو/g, "2")
    .replace(/سه/g, "3");

  if (/ایثارگر.*25\s*%|25\s*%/.test(normalized)) return "quota-25";
  if (/ایثارگر.*5\s*%|5\s*%/.test(normalized)) return "quota-5";
  if (/منطقه\s*1/.test(normalized)) return "region-1";
  if (/منطقه\s*2/.test(normalized)) return "region-2";
  if (/منطقه\s*3/.test(normalized)) return "region-3";

  return null;
}

function splitLegacyMajor(value: string) {
  const parts = value
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    major: parts[0] ?? normalizePersian(value),
    admissionType: parts.length > 1 ? parts.slice(1).join(" - ") : undefined,
  };
}

function parseLegacyCsv(text: string, path: string): AdmissionRecord[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((value) => normalizePersian(value));
  const column = (name: string) => headers.indexOf(normalizePersian(name));
  const yearColumn = column("سال");
  const groupColumn = column("گروه آزمایشی");
  const rankColumn = column("رتبه در سهمیه");
  const quotaColumn = column("سهمیه");
  const majorColumn = column("رشته قبولی");
  const universityColumn = column("دانشگاه قبولی");

  const records: AdmissionRecord[] = [];

  lines.slice(1).forEach((line, index) => {
    const values = parseCsvLine(line);
    const year = Number(values[yearColumn]);
    const rank = Number(values[rankColumn]);
    const quota = legacyQuota(values[quotaColumn] ?? "");
    const parsedMajor = splitLegacyMajor(values[majorColumn] ?? "");
    const university = normalizePersian(values[universityColumn] ?? "");
    const group = normalizePersian(values[groupColumn] ?? "");

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(rank) ||
      rank <= 0 ||
      !quota ||
      !parsedMajor.major
    ) {
      return;
    }

    records.push({
      id: `legacy-${year}-${quota}-${rank}-${index}`,
      year,
      quota,
      rank,
      major: parsedMajor.major,
      university,
      admissionType: parsedMajor.admissionType,
      group: group || undefined,
      source: path,
    });
  });

  return records;
}

function groupMatches(record: AdmissionRecord, group: ExamGroupKey) {
  if (group === "all") return true;

  const recordGroup = normalizePersian(record.group ?? "");
  if (!recordGroup) return false;

  return GROUP_ALIASES[group].some((alias) =>
    recordGroup.includes(normalizePersian(alias)),
  );
}

function quotaMatches(record: AdmissionRecord, quota: SelectedQuota) {
  return quota === "all" || record.quota === quota;
}

function groupLabel(group: ExamGroupKey | null) {
  return EXAM_GROUPS.find((item) => item.key === group)?.label ?? "انتخاب نشده";
}

function quotaLabel(quota: SelectedQuota | null) {
  if (quota === "all") return "مشاهده همه";
  return QUOTAS.find((item) => item.key === quota)?.label ?? "انتخاب نشده";
}

function AdmissionCard({
  record,
  showQuota,
  showGroup,
}: {
  record: AdmissionRecord;
  showQuota: boolean;
  showGroup: boolean;
}) {
  const university = record.university || "دانشگاه در منبع ثبت نشده";
  const quota = QUOTAS.find((item) => item.key === record.quota)?.label;

  return (
    <article className="result-card" aria-label={`${record.major}، ${university}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm font-black text-foreground">
          رتبه {toPersianDigits(record.rank)}
        </strong>
        <div className="flex flex-wrap items-center gap-1.5">
          {showQuota && quota ? (
            <span className="result-badge">{quota}</span>
          ) : null}
          {showGroup && record.group ? (
            <span className="result-badge">{record.group}</span>
          ) : null}
        </div>
      </div>

      <h4 className="result-major mt-3 text-sm font-semibold leading-6" title={record.major}>
        {record.major}
      </h4>
      <p
        className="result-university mt-1 text-xs leading-5 text-muted-foreground"
        title={university}
      >
        {university}
      </p>

      {record.admissionType ? (
        <p className="mt-2 text-xs font-medium leading-5 text-foreground/75">
          {record.admissionType}
        </p>
      ) : null}
    </article>
  );
}

function YearColumn({
  year,
  records,
  showQuota,
  showGroup,
}: {
  year: number;
  records: AdmissionRecord[];
  showQuota: boolean;
  showGroup: boolean;
}) {
  const featured = FEATURED_YEARS.has(year);
  const [visibleCount, setVisibleCount] = useState(RESULT_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visibleRecords = records.slice(0, visibleCount);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= records.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) =>
            Math.min(records.length, current + RESULT_BATCH),
          );
        }
      },
      { rootMargin: "1200px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [records.length, visibleCount]);

  return (
    <section
      className={featured ? "year-column year-column-featured" : "year-column year-column-archive"}
      aria-labelledby={`year-${year}`}
    >
      <header className="year-column-header">
        <span className="text-[11px] font-medium text-muted-foreground">
          {featured ? "سال‌های اصلی" : "آرشیو"}
        </span>
        <h3 id={`year-${year}`} className={featured ? "year-title-featured" : "year-title"}>
          {toPersianDigits(year)}
        </h3>
      </header>

      <div className="year-results">
        {records.length > 0 ? (
          <>
            {visibleRecords.map((record) => (
              <AdmissionCard
                key={record.id}
                record={record}
                showQuota={showQuota}
                showGroup={showGroup}
              />
            ))}
            {visibleCount < records.length ? (
              <div
                ref={sentinelRef}
                className="result-sentinel"
                aria-hidden="true"
              />
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <p>برای این سال رکوردی مطابق انتخابت ثبت نشده.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function DatabaseExplorer() {
  const [phase, setPhase] = useState<OnboardingPhase>("group");
  const [selectedGroup, setSelectedGroup] = useState<ExamGroupKey | null>(null);
  const [selectedQuota, setSelectedQuota] = useState<SelectedQuota | null>(null);
  const [records, setRecords] = useState<AdmissionRecord[]>(bootstrapRecords);
  const [dataIndex, setDataIndex] = useState<DataIndex | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [indexError, setIndexError] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: 0 });
  const [loadFailures, setLoadFailures] = useState(0);
  const [majorInput, setMajorInput] = useState("");
  const [activeMajor, setActiveMajor] = useState("");
  const [searching, setSearching] = useState(false);
  const loadingAttempted = useRef(false);

  useLayoutEffect(() => {
    const locked = isProtocol25Locked();
    const frame = window.requestAnimationFrame(() => {
      if (locked) setPhase("protocol25-terminated");
      else document.getElementById("app-boot-curtain")?.remove();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    // Remove the dark SSR curtain only after the locked screen has committed.
    if (phase === "protocol25-terminated") {
      document.getElementById("app-boot-curtain")?.remove();
    }
  }, [phase]);

  const terminateProtocol25 = useCallback(() => setPhase("protocol25-terminated"), []);

  useEffect(() => {
    if (isProtocol25Locked()) return;
    let active = true;

    fetch(withBasePath("/data/index.json"))
      .then(async (response) => {
        if (!response.ok) throw new Error("index unavailable");
        return (await response.json()) as DataIndex;
      })
      .then((index) => {
        if (!active) return;
        setDataIndex(index);
      })
      .catch(() => {
        if (!active) return;
        setIndexError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phase === "ready") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;

    if (dataReady) {
      const frame = window.requestAnimationFrame(() => setPhase("ready"));
      return () => window.cancelAnimationFrame(frame);
    }

    if (indexError) {
      const frame = window.requestAnimationFrame(() => setPhase("error"));
      return () => window.cancelAnimationFrame(frame);
    }

    if (!dataIndex || loadingAttempted.current) return;
    loadingAttempted.current = true;
    const currentIndex = dataIndex;

    let cancelled = false;

    async function loadEverything() {
      const shards = currentIndex.shards;
      const incoming: AdmissionRecord[] = [];
      let failures = 0;

      setLoadProgress({ done: 0, total: shards.length });

      await Promise.all(
        shards.map(async (shard) => {
          try {
            const response = await fetch(withBasePath(shard.path));
            if (!response.ok) throw new Error("shard unavailable");

            const data =
              shard.format === "csv" || shard.path.endsWith(".csv")
                ? parseLegacyCsv(await response.text(), shard.path)
                : ((await response.json()) as AdmissionRecord[]);

            if (Array.isArray(data)) {
              incoming.push(...data);
            }
          } catch {
            failures += 1;
          } finally {
            if (!cancelled) {
              setLoadProgress((current) => ({
                done: Math.min(current.total, current.done + 1),
                total: current.total,
              }));
            }
          }
        }),
      );

      if (cancelled) return;

      if (incoming.length === 0 && shards.length > 0) {
        setPhase("error");
        return;
      }

      setRecords(mergeRecords(bootstrapRecords, incoming));
      setLoadFailures(failures);
      setDataReady(true);
      setPhase("ready");
    }

    void loadEverything();

    return () => {
      cancelled = true;
    };
  }, [dataIndex, dataReady, indexError, phase]);

  const selectionRecords = useMemo(() => {
    if (!selectedGroup || !selectedQuota) return [];

    return records.filter(
      (record) =>
        groupMatches(record, selectedGroup) &&
        quotaMatches(record, selectedQuota),
    );
  }, [records, selectedGroup, selectedQuota]);

  const majorOptions = useMemo(
    () => uniqueValues(selectionRecords.map((record) => record.major)),
    [selectionRecords],
  );

  const visibleRecords = useMemo(() => {
    const query = normalizePersian(activeMajor);
    if (!query) return selectionRecords;

    return selectionRecords.filter((record) =>
      normalizePersian(record.major).includes(query),
    );
  }, [activeMajor, selectionRecords]);

  const recordsByYear = useMemo(() => {
    const grouped = new Map<number, AdmissionRecord[]>();

    for (const year of YEARS) {
      grouped.set(year, []);
    }

    for (const record of visibleRecords) {
      grouped.get(record.year)?.push(record);
    }

    for (const [, yearRecords] of grouped) {
      yearRecords.sort((a, b) => a.rank - b.rank);
    }

    return grouped;
  }, [visibleRecords]);

  function chooseGroup(group: ExamGroupKey) {
    if (phase !== "group") return;
    setSelectedGroup(group);
    setSelectedQuota(null);
    setPhase("quota");
  }

  function chooseQuota(quota: SelectedQuota) {
    if (phase !== "quota") return;
    setSelectedQuota(quota);
    setPhase(quota === "quota-25" ? "protocol25-init" : "loading");
  }

  function resetSetup() {
    if (phase.startsWith("protocol25-")) return;
    setSelectedGroup(null);
    setSelectedQuota(null);
    setMajorInput("");
    setActiveMajor("");
    setSearching(false);
    loadingAttempted.current = false;
    setPhase("group");
  }

  async function submitMajor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    setActiveMajor(majorInput.trim());

    window.requestAnimationFrame(() => {
      setSearching(false);
    });
  }

  const progressPercent =
    loadProgress.total > 0
      ? Math.round((loadProgress.done / loadProgress.total) * 100)
      : 0;

  if (phase === "protocol25-init" || phase === "protocol25-terminated") {
    return <Protocol25Screen terminated={phase === "protocol25-terminated"} onTerminate={terminateProtocol25} />;
  }

  return (
    <>
      {phase === "ready" ? <MatrixRainBackground /> : null}

      {phase !== "ready" ? (
        <div className="onboarding-overlay" role="dialog" aria-modal="true">
          <div className="onboarding-card">
            {phase === "group" ? (
              <>
                <p className="eyebrow">مرحله ۱ از ۲</p>
                <h2 className="onboarding-title">گروه آزمایشی‌ت رو انتخاب کن</h2>
                <p className="onboarding-copy">
                  اول مشخص کن کارنامه‌های کدوم گروه رو می‌خوای ببینی.
                </p>
                <div className="onboarding-options">
                  {EXAM_GROUPS.map((group) => (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => chooseGroup(group.key)}
                      className="onboarding-option"
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {phase === "quota" ? (
              <>
                <p className="eyebrow">مرحله ۲ از ۲</p>
                <h2 className="onboarding-title">نوع سهمیه‌ت رو انتخاب کن</h2>
                <p className="onboarding-copy">
                  بعد از این مرحله، همه داده‌های لازم یک‌جا بارگذاری می‌شن.
                </p>
                <div className="onboarding-options">
                  {QUOTAS.map((quota) => (
                    <button
                      key={quota.key}
                      type="button"
                      onClick={() => chooseQuota(quota.key)}
                      className="onboarding-option"
                    >
                      {quota.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => chooseQuota("all")}
                    className="onboarding-option"
                  >
                    مشاهده همه
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPhase("group")}
                  className="onboarding-back"
                >
                  برگشت به انتخاب گروه
                </button>
              </>
            ) : null}

            {phase === "loading" ? (
              <div className="loading-state" role="status" aria-live="polite">
                <div className="loading-spinner" aria-hidden="true" />
                <h2 className="onboarding-title">دارم دیتابیس رو آماده می‌کنم</h2>
                <p className="onboarding-copy">
                  همه سال‌ها الان بارگذاری می‌شن تا بعدش موقع اسکرول مکث نداشته باشی.
                </p>
                <div className="loading-track" aria-hidden="true">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {toPersianDigits(progressPercent)}٪
                </p>
              </div>
            ) : null}

            {phase === "error" ? (
              <>
                <h2 className="onboarding-title">بارگذاری کامل نشد</h2>
                <p className="onboarding-copy">
                  اتصال به فایل‌های دیتابیس کامل نشد. دوباره تلاش کن تا اطلاعات ناقص نمایش داده نشن.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="onboarding-option"
                >
                  تلاش دوباره
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <section id="database" aria-labelledby="database-title" className="database-shell">
        <div className="selection-summary">
          <div className="selection-item">
            <div>
              <span className="selection-label">گروه آزمایشی</span>
              <strong>{groupLabel(selectedGroup)}</strong>
            </div>
            <button type="button" onClick={resetSetup} className="selection-change">
              تغییر
            </button>
          </div>

          <div className="selection-item">
            <div>
              <span className="selection-label">سهمیه</span>
              <strong>{quotaLabel(selectedQuota)}</strong>
            </div>
            <button type="button" onClick={resetSetup} className="selection-change">
              تغییر
            </button>
          </div>
        </div>

        <div className="database-heading-row">
          <div>
            <p className="eyebrow">قبولی‌های ثبت‌شده</p>
            <h2 id="database-title" className="mt-1 text-2xl font-black tracking-tight">
              دیتابیس انتخاب رشته
            </h2>
          </div>
          {loadFailures > 0 ? (
            <p className="data-warning">
              بخشی از فایل‌ها در این بارگذاری در دسترس نبودند.
            </p>
          ) : null}
        </div>

        {SEARCH_TEMPORARILY_DISABLED ? (
          <div
            className="search-disabled-shell"
            role="status"
            aria-label="جست‌وجو موقتاً غیرفعال است"
          >
            <div className="hazard-strip" aria-hidden="true" />
            <div className="search-disabled-content">
              <form
                className="major-only-search major-only-search-disabled"
                aria-disabled="true"
                onSubmit={(event) => event.preventDefault()}
              >
                <label htmlFor="major-search" className="sr-only">
                  جست‌وجو بر اساس رشته
                </label>
                <Search
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="major-search"
                  value=""
                  placeholder="اسم رشته را بنویس؛ مثلاً پزشکی"
                  autoComplete="off"
                  disabled
                  readOnly
                />
                <button type="submit" disabled>
                  جست‌وجو
                </button>
              </form>
              <div className="search-disabled-message">
                موقتاً به دلیل حجم بالای دیتا غیرفعال می‌باشد.
              </div>
            </div>
            <div className="hazard-strip" aria-hidden="true" />
          </div>
        ) : (
          <form className="major-only-search" onSubmit={submitMajor}>
            <label htmlFor="major-search" className="sr-only">
              جست‌وجو بر اساس رشته
            </label>
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              id="major-search"
              list="major-search-options"
              value={majorInput}
              onChange={(event) => setMajorInput(event.target.value)}
              placeholder="اسم رشته را بنویس؛ مثلاً پزشکی"
              autoComplete="off"
            />
            <datalist id="major-search-options">
              {majorOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <button type="submit">جست‌وجو</button>
          </form>
        )}

        <p className="database-guide">
          داخل هر ستون به پایین اسکرول کن تا به رتبه‌های بالاتر برسی؛ برای دیدن سال‌های قدیمی‌تر، جدول را به سمت چپ بکش.
        </p>

        {activeMajor ? (
          <div className="active-major">
            نتایج رشته «{activeMajor}»
            <button
              type="button"
              onClick={() => {
                setMajorInput("");
                setActiveMajor("");
              }}
            >
              نمایش همه رشته‌ها
            </button>
          </div>
        ) : null}

        <p className="data-scope-note">
          فقط رکوردهای موجود در دیتابیس نمایش داده می‌شن؛ نبودن یک نتیجه به معنی نبودن آن قبولی در واقعیت نیست.
        </p>

        <div
          className="year-columns-rail"
          aria-label="سال‌های قبولی؛ هر ستون اسکرول عمودی مستقل دارد"
        >
          {YEARS.map((year) => (
            <YearColumn
              key={`${year}-${activeMajor}-${selectedGroup}-${selectedQuota}`}
              year={year}
              records={recordsByYear.get(year) ?? []}
              showQuota={selectedQuota === "all"}
              showGroup={selectedGroup === "all"}
            />
          ))}
        </div>

        {searching ? (
          <div className="search-loading" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true" />
            <span>در حال آماده‌سازی نتایج رشته…</span>
          </div>
        ) : null}
      </section>
    </>
  );
}
