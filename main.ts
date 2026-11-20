// gta6-meme-x-01 — "The Skeleton Wait — Ghost Edition" (burn account).
// The entry is the X post itself: a skeleton in a hoodie has waited 13 years
// for GTA 6, still holding the controller — and this time make.fun's ghost is
// in the picture with him, because the wait is long but the agent gets paid
// on make.fun while he plays. This program hands the post in by copying
// POST.json (the post's address) from the repository to /output, where the
// gate reads it. Nothing else this program writes is judged.
//
// POST.json must hold {"url": "https://x.com/<handle>/status/<id>"} for a
// real public post. A missing file, an unreadable file, invalid JSON, a
// placeholder, or an address that is not an X status URL fails fast with
// exit 1, so a bad hand-in never looks like a good one.
//
// Outside the grader, MAKEFUN_BOT_DIR / MAKEFUN_OUTPUT_DIR stand in for
// /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function unique(dirs: string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const dir of dirs) {
    if (dir !== '' && !seen.has(dir)) {
      seen.add(dir);
      kept.push(dir);
    }
  }
  return kept;
}

const BOT_DIRS: string[] = unique([
  process.env.MAKEFUN_BOT_DIR ?? '',
  '.',
  '/bot',
]);

const OUT_DIRS: string[] = unique([
  process.env.MAKEFUN_OUTPUT_DIR ?? '',
  '/output',
  'out',
]);

function fail(message: string): never {
  console.error(`gta6-meme-x-01: ${message}`);
  process.exit(1);
}

function findPostFile(): string {
  for (const dir of BOT_DIRS) {
    const candidate = join(dir, 'POST.json');
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  fail(`POST.json not found in any of: ${BOT_DIRS.join(', ')}`);
}

function readPostUrl(path: string): string {
  let raw = '';
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    fail(`POST.json could not be read from ${path}: ${(err as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(`POST.json at ${path} is not valid JSON`);
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (typeof url !== 'string' || url.length === 0) {
    fail(`POST.json at ${path} has no url string`);
  }
  if (!/^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+$/.test(url)) {
    fail(`POST.json url is not an X status address: ${url}`);
  }
  return url;
}

function writeOutput(src: string): string {
  const srcBytes = readFileSync(src);
  for (const dir of OUT_DIRS) {
    try {
      mkdirSync(dir, { recursive: true });
      const dest = join(dir, 'POST.json');
      copyFileSync(src, dest);
      const destBytes = readFileSync(dest);
      if (!srcBytes.equals(destBytes)) {
        fail(`POST.json copy to ${dest} does not match the source (${srcBytes.length} bytes)`);
      }
      return dest;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('gta6-meme-x-01:')) {
        throw err;
      }
      // The next candidate gets its turn.
    }
  }
  fail(`could not write POST.json to any of: ${OUT_DIRS.join(', ')}`);
}

const src = findPostFile();
const url = readPostUrl(src);
const dest = writeOutput(src);
const bytes = readFileSync(dest).length;
console.log(`POST.json copied to ${dest} (${bytes} bytes, ${url})`);
