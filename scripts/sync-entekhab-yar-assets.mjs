import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const REVISION = "5ae840b255d303200895acee2cf8b5577ab0c918";
const BASE = `https://raw.githubusercontent.com/wazyxoi/major-helper/${REVISION}`;
const DEST = path.join(process.cwd(), "public", "entekhab-yar");

const assets = [
  {
    name: "data.json",
    gitBlobSha1: "1ec53047f4ff56510d6797e7498ac19cbf593c62",
  },
  {
    name: "IRANSansX.woff2",
    gitBlobSha1: "edf6c55ec745cc1ea378098952698d2a9d88dad1",
  },
];

function gitBlobSha1(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash("sha1").update(header).update(buffer).digest("hex");
}

async function download(asset) {
  const url = `${BASE}/${asset.name}`;
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "site-entekhab-reshte-build" },
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const sha = gitBlobSha1(buffer);

      if (sha !== asset.gitBlobSha1) {
        throw new Error(
          `Integrity check failed for ${asset.name}: expected ${asset.gitBlobSha1}, got ${sha}`,
        );
      }

      await writeFile(path.join(DEST, asset.name), buffer);
      console.log(`Synced ${asset.name} (${buffer.length} bytes)`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw new Error(
    `Failed to sync ${asset.name} from pinned source: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

await mkdir(DEST, { recursive: true });
for (const asset of assets) {
  await download(asset);
}
