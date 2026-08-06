import { createHash } from 'node:crypto';
import { accessSync, constants, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import type { SourceRecord } from './types';

const manifestPath = resolve(process.cwd(), 'data/ondo/verification/manifest.json');
export const sourceRecords = JSON.parse(readFileSync(manifestPath, 'utf8')) as SourceRecord[];
const inside = (file: string, root: string) => file === root || file.startsWith(`${root}${sep}`);
const unsafeRelative = (value: unknown) => typeof value !== 'string' || !value || isAbsolute(value) || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\') || value.split(/[\\/]+/).includes('..');
const sourceError = (sourceId: unknown, message = 'source-not-verified') => Object.assign(new Error(`${message}: ${sourceId ?? 'unknown'}`), { code: message });

function fixturePath(source: SourceRecord): string {
  const sourceId = (source as Partial<SourceRecord> | null)?.sourceId;
  const relativePath = source?.response?.responseFixturePath;
  if (unsafeRelative(relativePath)) throw sourceError(sourceId);
  if (typeof relativePath !== 'string') throw sourceError(sourceId);
  const verificationRoot = resolve(process.cwd(), 'data/ondo/verification');
  try {
    const canonicalRoot = realpathSync(verificationRoot);
    const candidate = resolve(verificationRoot, relativePath);
    if (!inside(candidate, verificationRoot)) throw new Error();
    const canonicalFile = realpathSync(candidate);
    if (!inside(canonicalFile, canonicalRoot)) throw new Error();
    if (!statSync(canonicalFile).isFile()) throw new Error();
    accessSync(canonicalFile, constants.R_OK);
    return canonicalFile;
  } catch {
    throw sourceError(sourceId);
  }
}

export function gateSource(source: SourceRecord) {
  const value = source as Partial<SourceRecord> | null;
  const response = value?.response ?? null;
  const verification = value?.verification;
  const coverage = value?.coverage;
  const semantics = value?.semantics;
  const failureBehavior = value?.failureBehavior;
  const licensing = value?.licensing;
  const complete = Boolean(value && typeof value.sourceId === 'string' && value.verificationStatus === 'passed' && verification?.fixtureReplayable === true && Array.isArray(verification.blockers) && verification.blockers.length === 0 && response !== null && typeof response.httpStatus === 'number' && response.httpStatus >= 200 && response.httpStatus < 300 && typeof response.responseFixturePath === 'string' && typeof response.responseSha256 === 'string' && /^[a-f\d]{64}$/i.test(response.responseSha256) && (coverage?.fullAddress === 'all' || coverage?.stableId === 'all') && typeof semantics?.seriesIdentity === 'string' && semantics.seriesIdentity !== 'unknown' && failureBehavior?.publicationAction === 'fail-closed' && licensing?.redistributionPermission === 'approved' && licensing?.staticArtifactPermission === 'approved');
  if (!complete) throw sourceError(value?.sourceId);
  if (!value || !response) throw sourceError(value?.sourceId);
  try {
    if (createHash('sha256').update(readFileSync(fixturePath(source))).digest('hex') !== response.responseSha256) throw new Error();
  } catch {
    throw sourceError(value.sourceId);
  }
  return source;
}

export function getVerifiedSource(sourceId: string) {
  const source = sourceRecords.find((item) => item.sourceId === sourceId);
  if (!source) throw sourceError(sourceId);
  return gateSource(source);
}

export function isApprovedSource(source: unknown) {
  const sourceId = (source as Partial<SourceRecord> | null)?.sourceId;
  if (typeof sourceId !== 'string') return false;
  try {
    const approved = getVerifiedSource(sourceId);
    return JSON.stringify(approved) === JSON.stringify(source);
  } catch {
    return false;
  }
}
