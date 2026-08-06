import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { ondoAssets, ondoCatalogQuality } from './ondoAssets';
import { isApprovedSource } from './analytics/sourceRegistry';
import type { AnalyticsSnapshot } from './analytics/types';

const generatedRoot = resolve(process.cwd(), 'src/data/generated/ondo');
const hash = (value: unknown) => typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);
const inside = (file: string, root: string) => file === root || file.startsWith(`${root}${sep}`);
const unsafe = (value: unknown) => typeof value !== 'string' || !value || isAbsolute(value) || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\') || value.split(/[\\/]+/).includes('..');
const canonicalPath = (candidate: string, root: string) => {
  const lexicalRoot = resolve(root), lexical = resolve(candidate);
  if (!inside(lexical, lexicalRoot)) return null;
  try {
    const realRoot = existsSync(lexicalRoot) ? realpathSync(lexicalRoot) : lexicalRoot;
    if (existsSync(lexical)) return inside(realpathSync(lexical), realRoot) ? realpathSync(lexical) : null;
    let parent = dirname(lexical);
    while (parent !== lexicalRoot && !existsSync(parent)) parent = dirname(parent);
    return inside(realpathSync(parent), realRoot) ? lexical : null;
  } catch { return null; }
};
const safePath = (value: unknown) => {
  if (unsafe(value)) return null;
  const raw = String(value);
  const candidate = raw.startsWith('src/data/generated/ondo/') ? resolve(process.cwd(), raw) : resolve(generatedRoot, raw);
  return canonicalPath(candidate, generatedRoot);
};
const json = (file: string | null) => { try { return file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null; } catch { return null; } };
const sha = (file: string | null) => { try { return file ? createHash('sha256').update(readFileSync(file)).digest('hex') : null; } catch { return null; } };
const pick = (value: any, keys: string[]) => keys.map((key) => value?.[key]).find((item) => typeof item === 'string' && item.length > 0) ?? null;
const hashKeys = ['policyHash', 'methodHash', 'policySha256', 'methodSha256'];
const maxAgeDays = () => { const value = Number(process.env.ONDO_MAX_SNAPSHOT_AGE_DAYS ?? 7); return Number.isFinite(value) && value >= 0 ? value : 7; };
const timestampState = (value: unknown, now: number) => { if (typeof value !== 'string') return 'invalid'; const parsed = Date.parse(value); if (!Number.isFinite(parsed) || parsed > now) return 'invalid'; return now - parsed <= maxAgeDays() * 86400000 ? 'fresh' : 'stale'; };
const sourceAgeDays = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 86400000)) : null;
const freshnessReason = (snapshot: Partial<AnalyticsSnapshot>) => { const now = Date.now(); const generated = timestampState(snapshot.generatedAt, now); const catalog = timestampState(snapshot.catalogSnapshotAt, now); return generated === 'invalid' || catalog === 'invalid' ? 'invalid-snapshot-freshness' : generated === 'stale' || catalog === 'stale' ? 'stale-snapshot' : null; };
const fallback = (reason = 'no-generated-snapshot'): AnalyticsSnapshot => {
  const reasons = [reason];
  if (ondoCatalogQuality.reason && !reasons.includes(ondoCatalogQuality.reason)) reasons.push(ondoCatalogQuality.reason);
  return { schemaVersion: 1, snapshotId: 'catalog-fallback', generatedAt: null, catalogSnapshotAt: null, mode: 'catalog-fallback', sources: [], quality: { ...ondoCatalogQuality, reason, reasons, sourceAgeDays: null, catalogRows: ondoCatalogQuality.rowCount, unresolvedIdentities: ondoCatalogQuality.unresolvedIdentityCount, unavailableFields: ondoCatalogQuality.unavailableFieldCount, stale: true, fallback: true }, assets: ondoAssets };
};
const valid = (pointer: any, snapshot: any, manifest: any, snapshotFile: string | null, manifestFile: string | null) => {
  const snapshotHash = pick(pointer, ['snapshotSha256', 'snapshotHash', 'contentSha256']);
  const manifestHash = pick(pointer, ['manifestSha256', 'manifestHash']);
  const policyHash = pick(pointer, hashKeys);
  const sources = Array.isArray(snapshot?.sources) && snapshot.sources.length > 0 && new Set(snapshot.sources.map((source: any) => source?.sourceId)).size === snapshot.sources.length && snapshot.sources.every(isApprovedSource);
  return Number.isInteger(pointer?.schemaVersion) && pointer.schemaVersion > 0 && typeof pointer.snapshotId === 'string' && typeof pointer.manifestId === 'string' && pointer.snapshotId === snapshot?.snapshotId && pointer.snapshotId === manifest?.snapshotId && pointer.manifestId === (manifest?.manifestId ?? manifest?.snapshotId) && pointer.schemaVersion === snapshot?.schemaVersion && pointer.schemaVersion === manifest?.schemaVersion && snapshot?.mode === 'enriched' && Array.isArray(snapshot.assets) && sources && hash(snapshotHash) && hash(manifestHash) && snapshotHash === sha(snapshotFile) && manifestHash === sha(manifestFile) && snapshotHash === pick(manifest, ['snapshotSha256', 'snapshotHash', 'contentSha256']) && policyHash !== null && policyHash === pick(manifest, hashKeys) && (!snapshot.policyHash || snapshot.policyHash === policyHash);
};
const readCandidate = (file: string | null, forcedManifest: string | null = null) => {
  const value = json(file);
  if (!value) return null;
  if (typeof value.snapshotPath === 'string') {
    const snapshotFile = safePath(value.snapshotPath), manifestFile = safePath(value.manifestPath);
    const snapshot = json(snapshotFile), manifest = json(manifestFile);
    return snapshotFile && manifestFile && snapshot && manifest && valid(value, snapshot, manifest, snapshotFile, manifestFile) ? snapshot as AnalyticsSnapshot : null;
  }
  if (!forcedManifest || value.mode !== 'enriched') return null;
  const manifest = json(forcedManifest);
  const pointer = { snapshotId: value.snapshotId, manifestId: manifest?.manifestId ?? manifest?.snapshotId, schemaVersion: value.schemaVersion, snapshotSha256: sha(file), manifestSha256: sha(forcedManifest), policyHash: pick(manifest, hashKeys) };
  return manifest && valid(pointer, value, manifest, file, forcedManifest) ? value as AnalyticsSnapshot : null;
};
export const loadOndoAnalytics = (): AnalyticsSnapshot => {
  const envSnapshot = process.env.ONDO_SNAPSHOT_PATH;
  const envManifest = process.env.ONDO_SNAPSHOT_MANIFEST_PATH;
  const file = envSnapshot ? safePath(envSnapshot) : resolve(generatedRoot, 'current.json');
  const manifest = envManifest ? safePath(envManifest) : null;
  const snapshot = readCandidate(file, manifest);
  if (!snapshot) return fallback(file && existsSync(file) ? 'invalid-generated-snapshot' : 'no-generated-snapshot');
  const staleReason = freshnessReason(snapshot);
  if (staleReason) return fallback(staleReason);
  return { ...snapshot, quality: { ...(snapshot.quality ?? {}), sourceAgeDays: sourceAgeDays(snapshot.generatedAt) } };
};
export const ondoAnalytics = loadOndoAnalytics();
