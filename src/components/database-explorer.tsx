"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { admissionRecords as bootstrapRecords } from "@/data/admissions";
import {
  isSearchMode,
  matchesSearch,
  normalizePersian,
  QUOTAS,
  toPersianDigits,
  type AdmissionRecord,
  type QuotaKey,
  type SearchMode,
  YEARS,
} from "@/lib/admissions";

interface DataShard {
  year: number;
  quota: QuotaKey;
  path: string;
}

interface DataIndex {
  version: number;
  generatedAt: string;
  years: number[];
  majors: string[];
  universities: string[];
  shards: DataShard[];
}

const modeOptions: Array<{ value: SearchMode; label: string }> = [
  { value: "major", label: "رشته" },
  { value: "university", label: "دانشگاه" },
  { value: "both", label: "رشته + دانشگاه" },
];

const ROW_HEIGHT = 126;
const LARGE_LIST_THRESHOLD = 24;
const VIEWPORT_HEIGHT = 540;
const OVERSCAN = 4;

function recordIdentity(record: AdmissionRecord) {
  return [
    record.year,
    record.quota,
    record.rank,
    normalizePersian(record.major),
    normalizePersian(record.university),
    normalizePersian(record.admissionType ?? ""),
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

function AdmissionCard({ record }: { record: AdmissionRecord }) {
  return (
    <article className="result-card" aria-label={`${record.major}، ${record.university}`}>
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-bold text-foreground">
          رتبه {toPersianDigits(record.rank)}
        </strong>
        {record.group ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {record.group}
          </span>
        ) : null}
      </div>

      <h4 className="mt-3 text-sm font-semibold leading-6">{record.major}</h4>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {record.university || "دانشگاه در منبع ثبت نشده"}
      </p>

      {record.admissionType ? (
        <p className="mt-2 text-xs font-medium text-foreground/75">
          {record.admissionType}
        </p>
      ) : null}
    </article>
  );
}

function VirtualizedResultList({ records }: { records: AdmissionRecord[] }) {
  const [scrollTop, setScrollTop] = useState(0);

  if (records.length === 0) {
    return (
      <div className="empty-state">
        <p>رکوردی برای این بخش پیدا نشد.</p>
      </div>
    );
  }

  if (records.length <= LARGE_LIST_THRESHOLD) {
    return (
      <div className="space-y-2">
        {records.map((record) => (
          <AdmissionCard key={record.id} record={record} />
        ))}
      </div>
    );
  }

  const firstIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN,
  );
  const visibleCount =
    Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const lastIndex = Math.min(records.length, firstIndex + visibleCount);
  const visibleRecords = records.slice(firstIndex, lastIndex);

  return (
    <div
      className="virtual-list"
      style={{ height: VIEWPORT_HEIGHT }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      role="list"
      aria-label="نتایج قبولی"
    >
      <div
        className="relative"
        style={{ height: records.length * ROW_HEIGHT }}
      >
        {visibleRecords.map((record, offset) => {
          const index = firstIndex + offset;

          return (
            <div
              key={record.id}
              className="absolute inset-x-0"
              style={{
                top: index * ROW_HEIGHT,
                height: ROW_HEIGHT - 8,
              }}
              role="listitem"
            >
              <AdmissionCard record={record} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuotaColumn({
  quota,
  records,
}: {
  quota: QuotaKey;
  records: AdmissionRecord[];
}) {
  const meta = QUOTAS.find((item) => item.key === quota);

  return (
    <section className="quota-column" aria-label={meta?.label}>
      <div className="quota-title">{meta?.label}</div>
      <VirtualizedResultList records={records} />
    </section>
  );
}

function YearBlock({
  year,
  records,
  onVisible,
}: {
  year: number;
  records: AdmissionRecord[];
  onVisible: (year: number) => void;
}) {
  const [activeQuota, setActiveQuota] = useState<QuotaKey>("region-1");
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible(year);
        }
      },
      {
        rootMargin: "240px",
        threshold: 0.02,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onVisible, year]);

  const byQuota = useMemo(() => {
    const groups = new Map<QuotaKey, AdmissionRecord[]>();

    for (const quota of QUOTAS) {
      groups.set(quota.key, []);
    }

    for (const record of records) {
      groups.get(record.quota)?.push(record);
    }

    for (const [, list] of groups) {
      list.sort((a, b) => a.rank - b.rank);
    }

    return groups;
  }, [records]);

  return (
    <article
      ref={rootRef}
      className="year-block snap-center"
      aria-labelledby={`year-${year}`}
    >
      <header className="year-header">
        <div>
          <p className="text-xs font-medium text-muted-foreground">سال</p>
          <h3 id={`year-${year}`} className="text-2xl font-black tracking-tight">
            {toPersianDigits(year)}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          رتبه ← رشته، دانشگاه و نوع قبولی
        </span>
      </header>

      <div className="hidden gap-3 lg:grid lg:grid-cols-5">
        {QUOTAS.map((quota) => (
          <QuotaColumn
            key={quota.key}
            quota={quota.key}
            records={byQuota.get(quota.key) ?? []}
          />
        ))}
      </div>

      <div className="lg:hidden">
        <div
          className="mb-3 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="انتخاب سهمیه"
        >
          {QUOTAS.map((quota) => (
            <button
              key={quota.key}
              type="button"
              role="tab"
              aria-selected={activeQuota === quota.key}
              onClick={() => setActiveQuota(quota.key)}
              className={
                activeQuota === quota.key
                  ? "quota-tab quota-tab-active"
                  : "quota-tab"
              }
            >
              {quota.label}
            </button>
          ))}
        </div>

        <QuotaColumn
          quota={activeQuota}
          records={byQuota.get(activeQuota) ?? []}
        />
      </div>
    </article>
  );
}

function SearchField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="search-field" htmlFor={id}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          list={`${id}-options`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      <datalist id={`${id}-options`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

export function DatabaseExplorer() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get("mode");
  const [mode, setMode] = useState<SearchMode>(
    isSearchMode(initialMode) ? initialMode : "major",
  );
  const [major, setMajor] = useState(searchParams.get("major") ?? "");
  const [university, setUniversity] = useState(
    searchParams.get("university") ?? "",
  );
  const [records, setRecords] = useState<AdmissionRecord[]>(bootstrapRecords);
  const [dataIndex, setDataIndex] = useState<DataIndex | null>(null);
  const loadedPaths = useRef(new Set<string>());
  const loadingPaths = useRef(new Set<string>());

  const loadPaths = useCallback(async (paths: string[]) => {
    const pending = paths.filter(
      (path) =>
        !loadedPaths.current.has(path) && !loadingPaths.current.has(path),
    );

    if (pending.length === 0) return;

    for (const path of pending) {
      loadingPaths.current.add(path);
    }

    const incoming: AdmissionRecord[] = [];

    await Promise.all(
      pending.map(async (path) => {
        try {
          const response = await fetch(path);
          if (!response.ok) return;

          const data = (await response.json()) as AdmissionRecord[];
          if (Array.isArray(data)) {
            incoming.push(...data);
            loadedPaths.current.add(path);
          }
        } catch {
          // Keep the already-loaded real records if a shard is unavailable.
        } finally {
          loadingPaths.current.delete(path);
        }
      }),
    );

    if (incoming.length > 0) {
      setRecords((current) => mergeRecords(current, incoming));
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/data/index.json")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as DataIndex;
      })
      .then((index) => {
        if (!active || !index) return;

        setDataIndex(index);
        void loadPaths(
          index.shards
            .filter((shard) => shard.year === 1404)
            .map((shard) => shard.path),
        );
      })
      .catch(() => {
        // The bootstrap records remain available until generated shards exist.
      });

    return () => {
      active = false;
    };
  }, [loadPaths]);

  useEffect(() => {
    const hasSearch =
      (mode !== "university" && major.trim().length > 0) ||
      (mode !== "major" && university.trim().length > 0);

    if (!hasSearch || !dataIndex) return;

    void loadPaths(dataIndex.shards.map((shard) => shard.path));
  }, [dataIndex, loadPaths, major, mode, university]);

  useEffect(() => {
    const nextMode = searchParams.get("mode");
    setMode(isSearchMode(nextMode) ? nextMode : "major");
    setMajor(searchParams.get("major") ?? "");
    setUniversity(searchParams.get("university") ?? "");
  }, [searchParams]);

  const majors = useMemo(
    () =>
      dataIndex?.majors?.length
        ? dataIndex.majors
        : uniqueValues(records.map((record) => record.major)),
    [dataIndex, records],
  );
  const universities = useMemo(
    () =>
      dataIndex?.universities?.length
        ? dataIndex.universities
        : uniqueValues(
            records
              .map((record) => record.university)
              .filter(Boolean),
          ),
    [dataIndex, records],
  );

  const filteredRecords = useMemo(
    () =>
      records.filter((record) =>
        matchesSearch(record, mode, major, university),
      ),
    [major, mode, records, university],
  );

  const handleYearVisible = useCallback(
    (year: number) => {
      if (!dataIndex) return;

      void loadPaths(
        dataIndex.shards
          .filter((shard) => shard.year === year)
          .map((shard) => shard.path),
      );
    },
    [dataIndex, loadPaths],
  );

  function writeUrl(
    nextMode: SearchMode,
    nextMajor: string,
    nextUniversity: string,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);

    if (nextMajor.trim()) {
      params.set("major", nextMajor.trim());
    } else {
      params.delete("major");
    }

    if (nextUniversity.trim()) {
      params.set("university", nextUniversity.trim());
    } else {
      params.delete("university");
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function changeMode(nextMode: SearchMode) {
    setMode(nextMode);

    const nextMajor = nextMode === "university" ? "" : major;
    const nextUniversity = nextMode === "major" ? "" : university;

    setMajor(nextMajor);
    setUniversity(nextUniversity);
    writeUrl(nextMode, nextMajor, nextUniversity);
  }

  function changeMajor(value: string) {
    setMajor(value);
    writeUrl(mode, value, university);
  }

  function changeUniversity(value: string) {
    setUniversity(value);
    writeUrl(mode, major, value);
  }

  return (
    <section id="database" aria-labelledby="database-title" className="database-shell">
      <div className="database-toolbar">
        <div>
          <p className="eyebrow">جست‌وجوی قبولی‌ها</p>
          <h2 id="database-title" className="mt-1 text-2xl font-black tracking-tight">
            دیتابیس انتخاب رشته
          </h2>
        </div>

        <div className="segmented-control" aria-label="حالت جست‌وجو">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => changeMode(option.value)}
              className={
                mode === option.value
                  ? "segment-button segment-button-active"
                  : "segment-button"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="search-panel">
        {mode !== "university" ? (
          <SearchField
            id="major-search"
            label="رشته"
            value={major}
            onChange={changeMajor}
            options={majors}
            placeholder="مثلاً پزشکی"
          />
        ) : null}

        {mode !== "major" ? (
          <SearchField
            id="university-search"
            label="دانشگاه"
            value={university}
            onChange={changeUniversity}
            options={universities}
            placeholder="مثلاً دانشگاه علوم پزشکی تهران"
          />
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        فقط رکوردهای واقعی متصل‌شده به مخزن داده نمایش داده می‌شوند؛ مقدار ساختگی وارد نتایج نمی‌شود.
      </p>

      <div className="year-rail mt-6" aria-label="سال‌های قبولی">
        {YEARS.map((year) => (
          <YearBlock
            key={year}
            year={year}
            records={filteredRecords.filter((record) => record.year === year)}
            onVisible={handleYearVisible}
          />
        ))}
      </div>
    </section>
  );
}
