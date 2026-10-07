"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, Check, ChevronDown, ChevronUp, Copy, Download, Printer, Search, Trash2 } from "lucide-react";
import styles from "./major-helper.module.css";

type RawRow = {
  code: string;
  university: string;
  course_type: string;
  gender: string;
  capacity: string;
  description: string;
};
type Selection = RawRow & { major: string };
type Manifest = {
  year: number;
  totalMajors: number;
  totalRows: number;
  majors: Record<string, { file: string; rows: number }>;
  source: { url: string; repo: string };
};
type Shard = Record<string, RawRow[]>;
const KEY = "loprax-major-helper-1405-v1";
const dataCache = new Map<string, Shard>();
const count = (value: number) => value.toLocaleString("fa-IR");
const normalize = (value: string) => value.replace(/ي/g, "ی").replace(/ك/g, "ک").trim().toLocaleLowerCase("fa");
function safeRow(value: RawRow): RawRow {
  return {
    code: String(value.code ?? ""),
    university: String(value.university ?? ""),
    course_type: String(value.course_type ?? ""),
    gender: String(value.gender ?? ""),
    capacity: String(value.capacity ?? ""),
    description: String(value.description ?? ""),
  };
}
function isSelection(value: unknown): value is Selection {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return typeof r.code === "string" && typeof r.major === "string" && typeof r.university === "string";
}

export function MajorHelper() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestError, setManifestError] = useState("");
  const [major, setMajor] = useState("");
  const [university, setUniversity] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [favorites, setFavorites] = useState<Selection[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [visible, setVisible] = useState(80);
  const [copied, setCopied] = useState(false);
  const dragged = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
      if (Array.isArray(stored)) setFavorites(stored.filter(isSelection).slice(0, 1000));
    } catch {
      // Malformed old local storage should not block the tool.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(favorites)); } catch { /* private mode */ }
  }, [favorites, hydrated]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("./manifest.json", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() as Promise<Manifest>; })
      .then((result) => {
        if (!result.majors || !Object.keys(result.majors).length) throw new Error("فهرست رشته‌ها خالی است.");
        setManifest(result);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setManifestError(error instanceof Error ? error.message : "دریافت فهرست رشته‌ها ناموفق بود.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!manifest || !major) return;
    const controller = new AbortController();
    const location = manifest.majors[major]?.file;
    if (!location) return;
    const filename = location.split("/").at(-1) || "";
    const cacheKey = filename;
    const cached = dataCache.get(cacheKey);
    if (cached) {
      setRows((cached[major] || []).map(safeRow));
      setDataError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setDataError("");
    setRows([]);
    fetch("./data/" + encodeURIComponent(filename), { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() as Promise<Shard>; })
      .then((payload) => {
        dataCache.set(cacheKey, payload);
        setRows((payload[major] || []).map(safeRow));
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setDataError(error instanceof Error ? error.message : "دریافت اطلاعات این رشته ناموفق بود.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [manifest, major]);

  const majors = useMemo(() => Object.keys(manifest?.majors || {}).sort((a, b) => a.localeCompare(b, "fa")), [manifest]);
  const universities = useMemo(() => Array.from(new Set(rows.map((r) => r.university).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fa")), [rows]);
  const results = useMemo(() => {
    const needle = normalize(query);
    return rows.filter((r) =>
      (!university || r.university === university) &&
      (!needle || normalize([r.code, r.university, r.course_type, r.gender, r.capacity, r.description].join(" ")).includes(needle))
    );
  }, [rows, university, query]);
  const favoriteCodes = useMemo(() => new Set(favorites.map((f) => f.code)), [favorites]);

  function toggle(row: RawRow, selectedMajor = major) {
    setFavorites((prev) =>
      prev.some((f) => f.code === row.code)
        ? prev.filter((f) => f.code !== row.code)
        : [...prev, { ...safeRow(row), major: selectedMajor }]
    );
  }
  function move(index: number, delta: number) {
    setFavorites((previous) => {
      const target = index + delta;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function drop(index: number) {
    const from = dragged.current;
    dragged.current = null;
    if (from === null || from === index) return;
    setFavorites((previous) => {
      const next = [...previous];
      const [item] = next.splice(from, 1);
      next.splice(index, 0, item);
      return next;
    });
  }
  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(favorites.map((f) => f.code).join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.alert("کپی خودکار ممکن نشد. از خروجی JSON استفاده کن.");
    }
  }
  function exportFavorites() {
    const file = new Blob([JSON.stringify({ year: 1405, selections: favorites }, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "loprax-major-helper-1405.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main id="main-content" className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.back} href="/"><ArrowRight size={17} /> بازگشت به دیتابیس LoPRax</Link>
          <button className={styles.favButton} type="button" onClick={() => setFavoritesOpen((v) => !v)} aria-pressed={favoritesOpen}>
            <Bookmark size={17} /> {favoritesOpen ? "بازگشت به جستجو" : "لیست انتخاب‌ها"} <strong>{count(favorites.length)}</strong>
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>LOPRAX DATA • انتخاب رشته ۱۴۰۵</span>
        <h1>دستیار کدرشته‌محل‌های <span>۱۴۰۵</span></h1>
        <p>رشته و دانشگاهت رو انتخاب کن، جزئیات هر کدرشته‌محل رو ببین و اولویت‌هات رو مرتب و ذخیره کن.</p>
        <div className={styles.notice}>این ابزار بر پایه یک مجموعهٔ گردآوری‌شده برای گروه تجربی ساخته شده و جایگزین دفترچهٔ رسمی سازمان سنجش نیست.</div>
      </section>

      {favoritesOpen ? (
        <section className={styles.panel} aria-labelledby="favorite-title">
          <div className={styles.heading}>
            <div><h2 id="favorite-title">لیست انتخاب‌های من</h2><p>ترتیب انتخاب‌ها با دکمه‌های بالا و پایین یا کشیدن کارت قابل تغییره.</p></div>
            <div className={styles.actions}>
              <button type="button" disabled={!favorites.length} onClick={copyCodes}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "کپی شد" : "کپی کدها"}</button>
              <button type="button" disabled={!favorites.length} onClick={exportFavorites}><Download size={15} /> خروجی JSON</button>
              <button type="button" disabled={!favorites.length} onClick={() => window.print()}><Printer size={15} /> چاپ / PDF</button>
              <button type="button" className={styles.danger} disabled={!favorites.length} onClick={() => { if (window.confirm("همهٔ انتخاب‌ها حذف شوند؟")) setFavorites([]); }}><Trash2 size={15} /> حذف همه</button>
            </div>
          </div>
          {!favorites.length ? <div className={styles.empty}>فعلاً انتخابی ذخیره نکردی. از جستجو شروع کن.</div> : (
            <ol className={styles.favoriteList}>
              {favorites.map((row, index) => (
                <li key={row.code} draggable
                  onDragStart={() => { dragged.current = index; }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => drop(index)}
                  onDragEnd={() => { dragged.current = null; }}
                  className={styles.favoriteCard}>
                  <strong className={styles.order}>{count(index + 1)}</strong>
                  <div className={styles.favoriteText}>
                    <h3>{row.major} <span dir="ltr">{row.code}</span></h3>
                    <p>{row.university} · {row.course_type || "نوع دوره نامشخص"} · {row.gender || "جنسیت نامشخص"} · {row.capacity || "ظرفیت نامشخص"}</p>
                    {row.description && <small>{row.description}</small>}
                  </div>
                  <div className={styles.reorder}>
                    <button type="button" aria-label={"بردن انتخاب " + row.code + " به بالا"} disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={17} /></button>
                    <button type="button" aria-label={"بردن انتخاب " + row.code + " به پایین"} disabled={index === favorites.length - 1} onClick={() => move(index, 1)}><ChevronDown size={17} /></button>
                    <button type="button" aria-label={"حذف انتخاب " + row.code} onClick={() => toggle(row, row.major)}><Trash2 size={17} /></button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : (
        <>
          <section className={styles.filters} aria-label="فیلترهای انتخاب رشته">
            <label>رشته دانشگاهی
              <select value={major} disabled={!manifest} onChange={(e) => {setMajor(e.target.value); setUniversity(""); setQuery(""); setRows([]); setVisible(80);}}>
                <option value="">{manifest ? "یک رشته انتخاب کن" : "در حال دریافت فهرست..."}</option>
                {majors.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label>دانشگاه
              <select disabled={!major || loading} value={university} onChange={(e) => {setUniversity(e.target.value); setVisible(80);}}>
                <option value="">{major ? "همه دانشگاه‌ها" : "اول رشته را انتخاب کن"}</option>
                {universities.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label>جستجوی کد، دانشگاه و توضیحات
              <span className={styles.searchBox}><Search size={17} /><input type="search" value={query} onChange={(e) => {setQuery(e.target.value); setVisible(80);}} placeholder="کد یا عبارت مدنظرت..." disabled={!major} /></span>
            </label>
          </section>
          <section className={styles.panel} aria-live="polite">
            <div className={styles.heading}>
              <div><h2>کدرشته‌محل‌ها</h2><p>{major ? (loading ? "در حال دریافت اطلاعات..." : count(results.length) + " نتیجه برای " + major) : "برای شروع یک رشته دانشگاهی انتخاب کن."}</p></div>
              <span className={styles.year}>۱۴۰۵ · تجربی</span>
            </div>
            {manifestError && <div className={styles.error}>دریافت فهرست رشته‌ها ناموفق بود: {manifestError} <button type="button" onClick={() => window.location.reload()}>تلاش مجدد</button></div>}
            {dataError && <div className={styles.error}>اطلاعات این رشته بارگذاری نشد: {dataError} <button type="button" onClick={() => window.location.reload()}>تلاش مجدد</button></div>}
            {major && loading ? <div className={styles.empty}>در حال بارگذاری داده‌های رشته...</div> : !major ? <div className={styles.empty}>از فهرست بالا، رشتهٔ موردنظرت رو انتخاب کن.</div> : results.length === 0 ? <div className={styles.empty}>هیچ موردی با این فیلترها پیدا نشد.</div> : (
              <>
                <div className={styles.results}>
                  {results.slice(0, visible).map((row) => (
                    <article className={styles.card} key={row.code}>
                      <div className={styles.cardHeading}><h3>{major}</h3><span dir="ltr" className={styles.code}>{row.code}</span>
                        <button type="button" className={favoriteCodes.has(row.code) ? styles.activeStar : styles.star}
                          aria-label={favoriteCodes.has(row.code) ? "حذف از انتخاب‌ها" : "افزودن به انتخاب‌ها"}
                          aria-pressed={favoriteCodes.has(row.code)} onClick={() => toggle(row)}>
                          {favoriteCodes.has(row.code) ? "★" : "☆"}
                        </button>
                      </div>
                      <dl className={styles.grid}>
                        <div><dt>دانشگاه</dt><dd>{row.university || "ثبت نشده"}</dd></div>
                        <div><dt>دوره</dt><dd>{row.course_type || "ثبت نشده"}</dd></div>
                        <div><dt>جنسیت</dt><dd>{row.gender || "ثبت نشده"}</dd></div>
                        <div><dt>ظرفیت</dt><dd>{row.capacity || "ثبت نشده"}</dd></div>
                      </dl>
                      {row.description && <p className={styles.description}>{row.description}</p>}
                    </article>
                  ))}
                </div>
                {results.length > visible && <button className={styles.loadMore} type="button" onClick={() => setVisible((v) => v + 80)}>نمایش نتایج بیشتر ({count(results.length - visible)} باقی‌مانده)</button>}
              </>
            )}
          </section>
        </>
      )}
      <footer className={styles.footer}>
        <p>اطلاعات گردآوری‌شده را قبل از ثبت نهایی، با دفترچهٔ رسمی ۱۴۰۵ تطبیق بده. این بخش تضمین قبولی یا صحت همه کدرشته‌ها را ارائه نمی‌کند.</p>
        <a href="https://github.com/wazyxoi/major-helper" target="_blank" rel="noopener noreferrer">منبع گردآوری اولیه داده‌ها ↗</a>
        <Link href="/">بازگشت به LoPRax</Link>
      </footer>
    </main>
  );
}
