import { createHash } from 'node:crypto';
import { accessSync, constants, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';

const readManifest = (root = process.cwd()) => JSON.parse(readFileSync(resolve(root, 'data/ondo/verification/manifest.json'), 'utf8'));
const PROVIDER_LOADERS = Object.freeze({ ondo: () => import('./ondo.mjs'), dia: () => import('./dia.mjs'), perplexity: () => import('./perplexity.mjs') });
const hash = (value) => typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const sourceError = (sourceId, message = 'source-not-verified') => Object.assign(new Error(`${message}: ${sourceId ?? 'unknown'}`), { code: message });
const inside = (file, root) => file === root || file.startsWith(`${root}${sep}`);
const unsafeRelative = (value) => typeof value !== 'string' || !value || isAbsolute(value) || /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\') || value.split(/[\\/]+/).includes('..');

function fixturePath(source, root = process.cwd()) {
  const sourceId = source?.sourceId;
  const relativePath = source?.response?.responseFixturePath;
  if (unsafeRelative(relativePath)) throw sourceError(sourceId);
  const verificationRoot = resolve(root, 'data/ondo/verification');
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

export const fixtureSha256 = (source, root = process.cwd()) => createHash('sha256').update(readFileSync(fixturePath(source, root))).digest('hex');

export function gateSource(source, root = process.cwd()) {
  const sourceId = source?.sourceId;
  const response = source?.response;
  const verification = source?.verification;
  const coverage = source?.coverage;
  const semantics = source?.semantics;
  const failureBehavior = source?.failureBehavior;
  const licensing = source?.licensing;
  if (!source || typeof source !== 'object' || typeof sourceId !== 'string' || !owns(PROVIDER_LOADERS, source.provider)) throw sourceError(sourceId, 'source-not-verified');
  const complete = source.verificationStatus === 'passed' && verification?.fixtureReplayable === true && Array.isArray(verification.blockers) && verification.blockers.length === 0 && Number.isInteger(response?.httpStatus) && response.httpStatus >= 200 && response.httpStatus < 300 && typeof response.responseFixturePath === 'string' && hash(response.responseSha256) && (coverage?.fullAddress === 'all' || coverage?.stableId === 'all') && semantics?.seriesIdentity && semantics.seriesIdentity !== 'unknown' && failureBehavior?.publicationAction === 'fail-closed' && licensing?.redistributionPermission === 'approved' && licensing?.staticArtifactPermission === 'approved';
  if (!complete) throw sourceError(sourceId);
  try {
    if (fixtureSha256(source, root) !== response.responseSha256) throw new Error();
  } catch {
    throw sourceError(sourceId);
  }
  return source;
}

export function getVerifiedSource(sourceId, root = process.cwd()) {
  const source = readManifest(root).find((item) => item.sourceId === sourceId);
  if (!source) throw sourceError(sourceId);
  return gateSource(source, root);
}

export async function loadProvider(sourceId) {
  const source = getVerifiedSource(sourceId);
  const load = PROVIDER_LOADERS[source.provider];
  if (!load) throw sourceError(source.sourceId, 'provider-not-allowed');
  return load();
}
