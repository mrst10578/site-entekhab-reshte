# Architecture — Site Entekhab Reshte v1

## 1. Product shape

The public site is a read-heavy historical admission explorer.

The primary interaction is:

`year → quota → rank → major / university / admission type`

The UI supports years ۱۳۸۸ through ۱۴۰۴, while actual availability is determined only by the source repository.

## 2. Data boundaries

Canonical source:

`mrst10578/Entekhab-Reshte`

The site does not treat UI placeholders as data.

Current source formats include:

- Kanoon JSONL files grouped by exam group, year and region
- structured admission CSV files from Sajad
- structured admission CSV files from Sibtorsh
- normalized files for selected subsets

The importer intentionally handles multiple source shapes.

## 3. Domain model

The site-facing model is conceptually:

```ts
interface AdmissionRecord {
  id: string;
  year: number;
  quota: "region-1" | "region-2" | "region-3" | "quota-5" | "quota-25";
  rank: number;
  major: string;
  university: string;
  admissionType?: string;
  group?: string;
  source: string;
}
```

Missing values remain missing. They are not synthesized.

## 4. Build-time data pipeline

`scripts/sync-admissions.mjs` reads the source checkout.

Pipeline:

```text
raw source
  ↓
source-specific parser
  ↓
Persian normalization for matching
  ↓
quota mapping
  ↓
validation
  ↓
deduplication
  ↓
static data shards
  ↓
public/data/index.json
```

The generated index contains autocomplete vocabulary and shard locations.

The index is small enough to load independently from the historical records.

## 5. Runtime loading

The client starts with a tiny set of real bootstrap records so product behavior can be exercised before a full sync is present.

When `public/data/index.json` exists:

- the latest year is loaded after the index
- additional years load when their YearBlock approaches the viewport
- the index maps majors and universities to only the shard paths that can contain them
- active cross-year search requests only candidate shards instead of downloading the whole database
- records are merged and semantically deduplicated

The whole historical database is not required in the initial page payload.

A deployable snapshot is committed under `public/data`. The canonical source remains `mrst10578/Entekhab-Reshte`, but production reads the generated static snapshot instead of requiring runtime access to that private repository.

## 6. Search

Search modes are fixed to:

- major
- university
- both

Persian matching normalizes Arabic/Persian Yeh and Kaf, whitespace, and half-space differences while preserving canonical display values.

Search state is encoded in query parameters:

- `mode`
- `major`
- `university`

This enables sharing and browser Back/Forward behavior.

## 7. Rendering

Years are rendered inside a horizontal snap rail.

Desktop:

- five quota columns are shown in parallel

Mobile:

- the year remains the snap unit
- quota columns become a compact tabbed view to avoid an unusable 85-column surface

Large result sets use a small custom windowing implementation to reduce rendered DOM nodes. Virtualized cards use a bounded row height and clamped visual text so long university names cannot overlap adjacent rows; full text remains available to assistive technology and the element title.

## 8. 1405 contribution boundary

The public UI exposes the contribution concept but does not fake an upload.

Future workflow:

```text
Upload
→ privacy processing
→ extraction
→ pending review
→ admin approval
→ database
```

Personally identifying information must not be published.

The future admin interface should remain a separate application boundary.

## 9. Donations

The project donation URL and official Mahak URL are configuration values.

If they are absent, the UI is disabled rather than routing to an invented checkout.

Mahak donations must go directly to the verified official destination.

## 10. Testing

Critical coverage includes:

- Persian RTL document semantics
- three search modes
- URL state
- normalization helpers
- year rail
- mobile behavior
- large result windowing
- no fabricated fallback data

CI runs lint, typecheck, unit tests, production build and Playwright.
