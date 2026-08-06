/**
 * Enrich the catalog with canonical underlying identity and classification.
 *
 * Source: Perplexity web research via the `pwm` CLI (personal use). The
 * research step queries a bounded cohort of tokenized assets and records the
 * raw answer + citations as a replayable evidence fixture. The replay step
 * (default, offline) merges that fixture into the catalog snapshot and
 * publishes a mode:'enriched' snapshot through the same `current`/`previous`
 * pointer protocol, so the build never needs network access.
 *
 * Usage:
 *   npm run data:enrich            # replay committed evidence (offline)
 *   npm run data:enrich --research # run pwm research, refresh fixture+manifest
 *
 * The fixture must hash-match the `perplexity-classification` source record in
 * `data/ondo/verification/manifest.json` (getVerifiedSource enforces it).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCatalog, toCatalogAsset } from '../../src/data/analytics/catalogAdapter';
import type { OndoAssetClassification, OndoCatalogAsset } from '../../src/data/analytics/catalogAdapter';
import { summarizeCatalogQuality } from '../../src/data/analytics/catalogQuality.mjs';
import { publishCandidate, validateCandidate } from './update.mjs';
import { getVerifiedSource } from './providers/index.mjs';

const root = process.cwd();
const generatedRoot = resolve(root, 'src/data/generated/ondo');
const snapshotsDir = resolve(generatedRoot, 'snapshots');
const fixturesDir = resolve(root, 'data/ondo/verification/fixtures');
const fixturePath = resolve(fixturesDir, 'perplexity-classification.json');
const manifestPath = resolve(root, 'data/ondo/verification/manifest.json');
const SOURCE_ID = 'perplexity-classification';

const researchMode = process.argv.includes('--research');
const cohortSize = Number(process.env.COHORT_TOP ?? '40');
const BATCH = 8;

const snapId = () => {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}`;
  return `enriched-${stamp}`;
};

/** Symbol → canonical underlying ticker. Default rule: strip the trailing "on". */
const TICKER_OVERRIDES = Object.freeze({
  USDon: 'USDY', // Ondo U.S. Dollar Yield
  CRCLon: 'USDC', // Circle USD Coin
});
const underlyingTicker = (symbol: string | null | undefined): string | null => {
  if (TICKER_OVERRIDES[symbol as keyof typeof TICKER_OVERRIDES]) return TICKER_OVERRIDES[symbol as keyof typeof TICKER_OVERRIDES];
  if (typeof symbol !== 'string' || !symbol) return null;
  const match = /^(.+)on$/i.exec(symbol);
  return match ? match[1].toUpperCase() : null;
};

/** Map Perplexity security class to the existing taxonomy assetType. */
const assetTypeFromClass = (value: unknown): OndoAssetClassification['assetType'] => {
  const v = String(value ?? '').trim().toUpperCase();
  if (v.includes('EQUITY')) return 'equities';
  if (v.includes('ETF')) return 'equity-etfs';
  if (v.includes('BOND') || v.includes('FIXED') || v.includes('AGG')) return 'fixed-income';
  if (v.includes('STABLE') || v.includes('USDC') || v.includes('USDY')) return 'stablecoins';
  return 'unknown';
};

const parseClassificationLines = (answer: string) => {
  const rows: Array<{ ticker: string; securityClass: string; sector: string; tag: string }> = [];
  for (const line of String(answer ?? '').split('\n')) {
    const match = /^\s*([A-Z0-9.-]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.*)$/i.exec(line);
    if (match) rows.push({ ticker: match[1].trim().toUpperCase(), securityClass: match[2].trim(), sector: match[3].trim(), tag: match[4].trim() });
  }
  return rows;
};

async function runResearch(assets: OndoCatalogAsset[], topN: number) {
  const cohort = [...assets]
    .sort((a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1))
    .slice(0, topN)
    .map((asset) => ({ symbol: asset.symbol ?? '', ticker: underlyingTicker(asset.symbol), name: asset.tokenName ?? '' }));
  const evidence: Array<{ doneAt: string; tickers: string[]; prompt: string; answer: string; citations: unknown[] }> = [];
  for (let i = 0; i < cohort.length; i += BATCH) {
    const slice = cohort.slice(i, i + BATCH);
    const listed = slice.map((item) => `${item.ticker ?? item.symbol} (${item.name ?? item.symbol})`).join(', ');
    const prompt = `Classify each listed issuer as EQUITY, ETF, BOND, or STABLE (stablecoin). Give its sector and a 1-2 word short description. Issuers: ${listed}. Output as a compact list: TICKER | TYPE | sector | tag. Do not invent; say UNKNOWN per field when unsure.`;
    const raw = execFileSync('pwm', ['ask', prompt, '--json'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new Error('pwm-json-invalid'); }
    if (typeof parsed.answer !== 'string' || parsed.answer.startsWith('Error')) throw new Error(`pwm-ask-failed: ${String(parsed.answer).slice(0, 120)}`);
    evidence.push({ doneAt: new Date().toISOString(), tickers: slice.map((item) => item.ticker ?? item.symbol), prompt, answer: parsed.answer, citations: Array.isArray(parsed.citations) ? parsed.citations : [] });
    console.log(JSON.stringify({ batch: i / BATCH + 1, tickers: slice.length, remaining: cohort.length - i - slice.length, answerSample: parsed.answer.slice(0, 90) }));
  }
  mkdirSync(fixturesDir, { recursive: true });
  writeFileSync(fixturePath, JSON.stringify(evidence, null, 2));
  const sha = createHash('sha256').update(readFileSync(fixturePath)).digest('hex');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const record = manifest.find((item) => item.sourceId === SOURCE_ID);
  if (!record) throw new Error('manifest-missing-perplexity-classification');
  record.response.responseSha256 = sha;
  record.retrievedAt = new Date().toISOString();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ research: 'done', evidenceEntries: evidence.length, fixtureSha256: sha, cohort: cohort.length }));
  return evidence;
}

function readEvidence() {
  if (!existsSync(fixturePath)) throw new Error('fixture-missing: run `npm run data:enrich --research` first');
  return JSON.parse(readFileSync(fixturePath, 'utf8'));
}

function buildClassificationMap(evidence: Array<{ answer: string; citations?: unknown[] }>) {
  const map = new Map<string, { ticker: string; securityClass: string; sector: string; tag: string; assetType: OndoAssetClassification['assetType']; citations: unknown[] }>();
  for (const entry of evidence) {
    const rows = parseClassificationLines(entry.answer);
    for (const row of rows) map.set(row.ticker, { ...row, assetType: assetTypeFromClass(row.securityClass), citations: entry.citations ?? [] });
  }
  return map;
}

const source = readFileSync(resolve(root, 'ontonew.md'), 'utf8');
const rows = parseCatalog(source);
const baseAssets = rows.map((row) => toCatalogAsset(row));
const catalogQuality = summarizeCatalogQuality(rows, 'ontonew.md', rows.length ? 'available' : 'catalog-source-malformed');

const evidence = researchMode ? await runResearch(baseAssets, cohortSize) : readEvidence();
const classification = buildClassificationMap(evidence);

let classifiedCount = 0;
const assets = baseAssets.map((asset) => {
  const ticker = underlyingTicker(asset.symbol);
  const match = ticker ? classification.get(ticker) : null;
  if (!match) return { ...asset, canonicalKey: null };
  classifiedCount += 1;
  return {
    ...asset,
    canonicalKey: ticker,
    classification: { assetType: match.assetType, sector: match.sector === 'UNKNOWN' ? null : match.sector, description: match.tag === 'UNKNOWN' ? null : match.tag, canonicalTicker: ticker, sourceId: SOURCE_ID, citations: match.citations },
  };
});

const generatedAt = new Date().toISOString();
const snapshotId = snapId();
const policy = 'static-catalog-v1+perplexity-classification-v1';
const policyHash = createHash('sha256').update(policy).digest('hex');
const sourceRecord = getVerifiedSource(SOURCE_ID, root);

const candidate = {
  schemaVersion: 1,
  snapshotId,
  mode: 'enriched',
  generatedAt,
  catalogSnapshotAt: null,
  sources: [sourceRecord],
  policy,
  policyHash,
  scoreConfig: { minimumWeightCoverage: 0.7, minimumValidFactors: 4, factors: [1, 2, 3, 4, 5, 6] },
  quality: {
    ...catalogQuality,
    catalogRows: rows.length,
    unresolvedIdentities: catalogQuality.unresolvedIdentityCount,
    unavailableFields: catalogQuality.unavailableFieldCount,
    sourceAgeDays: null,
    stale: false,
    fallback: false,
    coverage: { classified: classifiedCount, total: rows.length, source: SOURCE_ID },
  },
  assets,
};
validateCandidate(candidate, root);

mkdirSync(snapshotsDir, { recursive: true });
const snapshotFile = resolve(snapshotsDir, `${snapshotId}.json`);
const manifestFile = resolve(snapshotsDir, `${snapshotId}.manifest.json`);
writeFileSync(snapshotFile, JSON.stringify(candidate, null, 2));
const snapshotSha256 = createHash('sha256').update(readFileSync(snapshotFile)).digest('hex');
const manifest = { schemaVersion: 1, snapshotId, manifestId: `manifest-${snapshotId}`, snapshotSha256, policyHash };
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
const manifestSha256 = createHash('sha256').update(readFileSync(manifestFile)).digest('hex');
const candidatePointer = { schemaVersion: 1, snapshotId, manifestId: manifest.manifestId, snapshotPath: `snapshots/${snapshotId}.json`, manifestPath: `snapshots/${snapshotId}.manifest.json`, snapshotSha256, manifestSha256, policyHash };
const candidatePath = resolve(generatedRoot, 'candidate.json');
const candidatePointerPath = resolve(generatedRoot, 'candidate.pointer.json');
const currentPointerPath = resolve(generatedRoot, 'current.json');
const previousPointerPath = resolve(generatedRoot, 'previous.json');
writeFileSync(candidatePath, JSON.stringify(candidate));
writeFileSync(candidatePointerPath, JSON.stringify(candidatePointer));
const result = publishCandidate({ candidatePath, candidatePointerPath, currentPointerPath, previousPointerPath, root, snapshotRoot: generatedRoot });
console.log(JSON.stringify({ ...result, snapshotId, mode: 'enriched', rows: rows.length, classified: classifiedCount, sources: sourceRecord.sourceId }));