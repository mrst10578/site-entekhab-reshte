import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.resolve(
  projectRoot,
  process.env.SOURCE_DATA_ROOT ?? "../Entekhab-Reshte/data/raw",
);
const normalizedRoot = path.join(path.dirname(sourceRoot), "normalized");
const outputRoot = path.join(projectRoot, "public", "data");

const supportedYears = new Set(
  Array.from({ length: 17 }, (_, index) => 1404 - index),
);

const quotaLabels = {
  "region-1": "منطقه ۱",
  "region-2": "منطقه ۲",
  "region-3": "منطقه ۳",
  "quota-5": "۵ درصد",
  "quota-25": "۲۵ درصد",
};

const groupByFolder = {
  experimental: "تجربی",
  math: "ریاضی",
  humanities: "انسانی",
};

function normalizePersian(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quotaKey(value) {
  const text = normalizePersian(value).replace(/٪/g, "%");

  if (/25\s*%|25\s*درصد/.test(text)) return "quota-25";
  if (/5\s*%|5\s*درصد/.test(text)) return "quota-5";
  if (/منطقه\s*1|^1$/.test(text)) return "region-1";
  if (/منطقه\s*2|^2$/.test(text)) return "region-2";
  if (/منطقه\s*3|^3$/.test(text)) return "region-3";

  return null;
}

function parseAcceptedRaw(input) {
  const raw = normalizePersian(input);
  if (!raw) {
    return { major: "", university: "", admissionType: undefined };
  }

  if (raw.includes("|")) {
    const parts = raw
      .split("|")
      .map((part) => normalizePersian(part))
      .filter(Boolean);

    return {
      major: parts[0] ?? "",
      university: parts[1] ?? "",
      admissionType: parts[2] || undefined,
    };
  }

  let working = raw;
  let admissionType;

  const suffixMatch = working.match(
    /--\s*(نوبت دوم|شهریه ?پرداز|پردیس(?: خودگردان)?|روزانه|آزاد|تعهدی|فرهنگیان)\s*$/,
  );
  if (suffixMatch) {
    admissionType = suffixMatch[1];
    working = working.slice(0, suffixMatch.index).trim();
  }

  const institutionMarkers = [
    " دانشگاه ",
    " دانشکده ",
    " مرکز آموزش عالی ",
    " مجتمع آموزش عالی ",
    " موسسه آموزش عالی ",
    " مؤسسه آموزش عالی ",
    " آموزشکده ",
  ];

  let index = -1;
  for (const marker of institutionMarkers) {
    const candidate = working.indexOf(marker);
    if (candidate > 0 && (index === -1 || candidate < index)) {
      index = candidate;
    }
  }

  if (index === -1) {
    return {
      major: working,
      university: "",
      admissionType,
    };
  }

  return {
    major: working.slice(0, index).trim(),
    university: working.slice(index + 1).trim(),
    admissionType,
  };
}

function parseCsvLine(line) {
  const result = [];
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
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizePersian);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(directory) {
  if (!(await exists(directory))) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(target) : [target];
    }),
  );

  return nested.flat();
}

function makeId(record) {
  const raw = [
    record.year,
    record.quota,
    record.rank,
    normalizePersian(record.major),
    normalizePersian(record.university),
    normalizePersian(record.admissionType ?? ""),
    normalizePersian(record.group ?? ""),
  ].join("|");

  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${record.year}-${record.quota}-${(hash >>> 0).toString(36)}`;
}

function recordKey(record) {
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

async function readKanoonJsonl(file) {
  const match = file.match(
    /kanoon[\\/](experimental|math|humanities)[\\/](\d{4})[\\/]region-([123])\.jsonl$/,
  );
  if (!match) return [];

  const [, folder, yearText, region] = match;
  const year = Number(yearText);
  if (!supportedYears.has(year)) return [];

  const text = await readFile(file, "utf8");
  const records = [];

  for (const [lineIndex, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;

    try {
      const row = JSON.parse(line);
      const quota = quotaKey(row.quota_region ?? region);
      const rank = Number(row.quota_rank);
      const accepted = parseAcceptedRaw(row.accepted_raw);

      if (!quota || !Number.isFinite(rank) || rank <= 0 || !accepted.major) {
        continue;
      }

      const record = {
        id: "",
        year,
        quota,
        rank,
        major: accepted.major,
        university: accepted.university,
        admissionType: accepted.admissionType,
        group: groupByFolder[folder],
        source: path.relative(path.resolve(sourceRoot, ".."), file),
      };
      record.id = makeId(record);
      records.push(record);
    } catch (error) {
      console.warn(
        `Skipping invalid JSONL row ${file}:${lineIndex + 1}: ${error.message}`,
      );
    }
  }

  return records;
}

async function readStructuredAdmissionsCsv(file) {
  if (!/[\\/](sajad|sibtorsh)[\\/].*[\\/]admissions\.csv$/.test(file)) {
    return [];
  }

  const rows = parseCsv(await readFile(file, "utf8"));
  const records = [];

  for (const row of rows) {
    const year = Number(row["سال"]);
    const quota = quotaKey(row["سهمیه"]);
    const rank = Number(row["رتبه در سهمیه"]);
    const major = normalizePersian(row["رشته قبولی"]);
    const university = normalizePersian(row["دانشگاه قبولی"]);
    const admissionType = normalizePersian(row["نوع دوره قبولی"]);

    if (
      !supportedYears.has(year) ||
      !quota ||
      !Number.isFinite(rank) ||
      rank <= 0 ||
      !major
    ) {
      continue;
    }

    const record = {
      id: "",
      year,
      quota,
      rank,
      major,
      university,
      admissionType: admissionType || undefined,
      group: normalizePersian(row["گروه آزمایشی"]) || undefined,
      source: path.relative(path.resolve(sourceRoot, ".."), file),
    };
    record.id = makeId(record);
    records.push(record);
  }

  return records;
}


function parseMajorAndType(value) {
  const normalized = normalizePersian(value);
  const match = normalized.match(
    /\s*-\s*(روزانه|نوبت دوم|شهریه ?پرداز|پردیس(?: خودگردان)?|آزاد|تعهدی|فرهنگیان)\s*$/,
  );

  if (!match) {
    return { major: normalized, admissionType: undefined };
  }

  return {
    major: normalized.slice(0, match.index).trim(),
    admissionType: match[1],
  };
}

async function readNormalizedArtLanguageCsv(file) {
  if (!/[\\/]kanoon[\\/]art-language[\\/]rank_to_admission_\d{4}\.csv$/.test(file)) {
    return [];
  }

  const rows = parseCsv(await readFile(file, "utf8"));
  const records = [];

  for (const row of rows) {
    const year = Number(row["سال"]);
    const quota = quotaKey(row["سهمیه"]);
    const rank = Number(row["رتبه در سهمیه"]);
    const parsedMajor = parseMajorAndType(row["رشته قبولی"]);
    const university = normalizePersian(row["دانشگاه قبولی"]);
    const group = normalizePersian(row["گروه آزمایشی"]);

    if (
      !supportedYears.has(year) ||
      !quota ||
      !Number.isFinite(rank) ||
      rank <= 0 ||
      !parsedMajor.major
    ) {
      continue;
    }

    const record = {
      id: "",
      year,
      quota,
      rank,
      major: parsedMajor.major,
      university,
      admissionType: parsedMajor.admissionType,
      group: group || undefined,
      source: path.relative(path.resolve(sourceRoot, ".."), file),
    };

    record.id = makeId(record);
    records.push(record);
  }

  return records;
}

async function main() {
  if (!(await exists(sourceRoot))) {
    throw new Error(
      `SOURCE_DATA_ROOT does not exist: ${sourceRoot}. Point it at Entekhab-Reshte/data/raw.`,
    );
  }

  const files = await walkFiles(sourceRoot);
  const normalizedFiles = await walkFiles(
    path.join(normalizedRoot, "kanoon", "art-language"),
  );
  const all = [];

  for (const file of files) {
    if (file.endsWith(".jsonl")) {
      all.push(...(await readKanoonJsonl(file)));
    } else if (file.endsWith("admissions.csv")) {
      all.push(...(await readStructuredAdmissionsCsv(file)));
    }
  }

  for (const file of normalizedFiles) {
    if (file.endsWith(".csv")) {
      all.push(...(await readNormalizedArtLanguageCsv(file)));
    }
  }

  const deduped = new Map();
  for (const record of all) {
    const key = recordKey(record);
    if (!deduped.has(key)) deduped.set(key, record);
  }

  const records = [...deduped.values()];
  records.sort((a, b) => a.year - b.year || a.rank - b.rank);

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const shards = [];
  const majors = new Map();
  const universities = new Map();
  const majorShards = new Map();
  const universityShards = new Map();

  function addShardLocation(map, value, shardPath) {
    const normalized = normalizePersian(value);
    if (!normalized) return;

    if (!map.has(normalized)) {
      map.set(normalized, { value, paths: new Set() });
    }

    map.get(normalized).paths.add(shardPath);
  }

  for (const year of [...supportedYears].sort((a, b) => b - a)) {
    for (const quota of Object.keys(quotaLabels)) {
      const shardRecords = records.filter(
        (record) => record.year === year && record.quota === quota,
      );

      if (shardRecords.length === 0) continue;

      const yearDirectory = path.join(outputRoot, String(year));
      await mkdir(yearDirectory, { recursive: true });

      const relativePath = `/data/${year}/${quota}.json`;
      await writeFile(
        path.join(yearDirectory, `${quota}.json`),
        JSON.stringify(shardRecords),
        "utf8",
      );

      shards.push({ year, quota, path: relativePath });

      for (const record of shardRecords) {
        majors.set(normalizePersian(record.major), record.major);
        if (record.university) {
          universities.set(
            normalizePersian(record.university),
            record.university,
          );
        }
        addShardLocation(majorShards, record.major, relativePath);
        addShardLocation(universityShards, record.university, relativePath);
      }
    }
  }

  const index = {
    version: 2,
    sourceCommit: process.env.SOURCE_DATA_COMMIT || undefined,
    years: [...new Set(records.map((record) => record.year))].sort(
      (a, b) => b - a,
    ),
    quotas: Object.entries(quotaLabels).map(([key, label]) => ({
      key,
      label,
    })),
    majors: [...majors.values()].sort((a, b) => a.localeCompare(b, "fa")),
    universities: [...universities.values()].sort((a, b) =>
      a.localeCompare(b, "fa"),
    ),
    majorShards: Object.fromEntries(
      [...majorShards.values()].map(({ value, paths }) => [
        value,
        [...paths].sort(),
      ]),
    ),
    universityShards: Object.fromEntries(
      [...universityShards.values()].map(({ value, paths }) => [
        value,
        [...paths].sort(),
      ]),
    ),
    shards,
  };

  await writeFile(
    path.join(outputRoot, "index.json"),
    JSON.stringify(index),
    "utf8",
  );

  console.log(
    `Generated ${records.length} deduplicated admission records across ${shards.length} shards.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
