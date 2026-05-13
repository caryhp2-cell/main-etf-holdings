import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

import Papa from "papaparse";

import { ETF_CODES, type EtfCode } from "../src/holdings/types";

export interface HoldingsManifestFile {
  date: string;
  etfCode: EtfCode;
  path: string;
  rowCount: number;
}

export interface HoldingsManifest {
  generatedAt: string;
  etfs: EtfCode[];
  dates: string[];
  files: HoldingsManifestFile[];
}

interface BuildManifestOptions {
  rootDir?: string;
  generatedAt?: Date;
}

const DATE_DIR_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function buildHoldingsManifest(
  options: BuildManifestOptions = {}
): Promise<HoldingsManifest> {
  const rootDir = options.rootDir ?? process.cwd();
  const holdingsDir = join(rootDir, "data", "holdings");
  const generatedAt = options.generatedAt ?? new Date();
  const dates = await readDateDirs(holdingsDir);
  const files: HoldingsManifestFile[] = [];

  for (const date of dates) {
    for (const etfCode of ETF_CODES) {
      const filePath = join(holdingsDir, date, `${etfCode}.csv`);

      if (!(await fileExists(filePath))) {
        continue;
      }

      files.push({
        date,
        etfCode,
        path: toPublicDataPath(rootDir, filePath),
        rowCount: await countCsvRows(filePath),
      });
    }
  }

  return {
    generatedAt: generatedAt.toISOString(),
    etfs: [...ETF_CODES],
    dates,
    files,
  };
}

export async function writeHoldingsManifest(
  options: BuildManifestOptions = {}
): Promise<string> {
  const rootDir = options.rootDir ?? process.cwd();
  const manifest = await buildHoldingsManifest({ ...options, rootDir });
  const outputPath = join(rootDir, "data", "manifest.json");
  const stableManifest = await preserveGeneratedAtIfUnchanged(outputPath, manifest);

  await mkdir(join(rootDir, "data"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(stableManifest, null, 2)}\n`, "utf8");

  return outputPath;
}

async function preserveGeneratedAtIfUnchanged(
  outputPath: string,
  nextManifest: HoldingsManifest
): Promise<HoldingsManifest> {
  if (!(await fileExists(outputPath))) {
    return nextManifest;
  }

  const previous = JSON.parse(await readFile(outputPath, "utf8")) as HoldingsManifest;
  if (manifestContentEquals(previous, nextManifest)) {
    return { ...nextManifest, generatedAt: previous.generatedAt };
  }

  return nextManifest;
}

function manifestContentEquals(
  previous: HoldingsManifest,
  nextManifest: HoldingsManifest
): boolean {
  const previousContent = withoutGeneratedAt(previous);
  const nextContent = withoutGeneratedAt(nextManifest);

  return JSON.stringify(previousContent) === JSON.stringify(nextContent);
}

function withoutGeneratedAt(manifest: HoldingsManifest): Omit<HoldingsManifest, "generatedAt"> {
  return {
    etfs: manifest.etfs,
    dates: manifest.dates,
    files: manifest.files,
  };
}

async function readDateDirs(holdingsDir: string): Promise<string[]> {
  if (!(await fileExists(holdingsDir))) {
    return [];
  }

  const entries = await readdir(holdingsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && DATE_DIR_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function countCsvRows(filePath: string): Promise<number> {
  const csv = await readFile(filePath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.length;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

function toPublicDataPath(rootDir: string, filePath: string): string {
  return `/${relative(rootDir, filePath).split(sep).join("/")}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeHoldingsManifest()
    .then((outputPath) => {
      console.log(`Wrote ${toPublicDataPath(process.cwd(), outputPath)}`);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
