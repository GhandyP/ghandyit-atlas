import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { getVerifiedSource } from './providers/index.mjs';

const hash = (value) => typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);
const relative = (value) => typeof value === 'string' && value && !isAbsolute(value) && !/^[a-zA-Z]:[\\/]/.test(value) && !value.startsWith('\\') && !value.split(/[\\/]+/).includes('..');
const inside = (file, root) => file === root || file.startsWith(`${root}${sep}`);
const canonicalPath = (value, root) => {
  if (!relative(value)) return null;
  const lexicalRoot = resolve(root), candidate = resolve(lexicalRoot, value);
  if (!inside(candidate, lexicalRoot)) return null;
  try {
    if (!existsSync(lexicalRoot)) return candidate;
    const realRoot = realpathSync(lexicalRoot);
    if (existsSync(candidate)) return inside(realpathSync(candidate), realRoot) ? realpathSync(candidate) : null;
    let parent = dirname(candidate);
    while (parent !== lexicalRoot && !existsSync(parent)) parent = dirname(parent);
    return inside(realpathSync(parent), realRoot) ? candidate : null;
  } catch { return null; }
};
const json = (file, label) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { throw new Error(`${label}-pointer-invalid`); } };
const fileHash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const pointerFile = (value, snapshotRoot) => canonicalPath(value, snapshotRoot);
const publicationTarget = (file, snapshotRoot) => {
  const root = resolve(snapshotRoot), target = resolve(file);
  if (!inside(target, root)) return false;
  try { return inside(existsSync(target) ? realpathSync(target) : realpathSync(dirname(target)), existsSync(root) ? realpathSync(root) : root); } catch { return false; }
};

export function validatePointer(pointer, label = 'pointer', root = process.cwd(), snapshotRoot = resolve(root, 'src/data/generated/ondo')) {
  if (!pointer || typeof pointer !== 'object' || !Number.isInteger(pointer.schemaVersion) || typeof pointer.snapshotId !== 'string' || !pointer.snapshotId || typeof pointer.manifestId !== 'string' || !pointer.manifestId || !pointerFile(pointer.snapshotPath, snapshotRoot) || !pointerFile(pointer.manifestPath, snapshotRoot) || !hash(pointer.snapshotSha256) || !hash(pointer.manifestSha256)) throw new Error(`${label}-pointer-invalid`);
  return pointer;
}

const assetId = (asset) => asset?.rawRowKey ?? asset?.canonicalId ?? asset?.canonicalKey ?? asset?.assetId ?? asset?.identity?.stableId ?? asset?.identity?.normalizedAddress ?? null;
const validateAssets = (assets) => {
  const ids = assets.map(assetId);
  return ids.every((id) => typeof id === 'string' && id.trim()) && new Set(ids.map((id) => id.toLowerCase())).size === ids.length;
};
export function validateCandidate(candidate, root = process.cwd()) {
  const config = candidate?.scoreConfig;
  const base = candidate && Number.isInteger(candidate.schemaVersion) && typeof candidate.snapshotId === 'string' && candidate.snapshotId && Array.isArray(candidate.assets) && validateAssets(candidate.assets) && Array.isArray(candidate.sources);
  if (!base) throw new Error('candidate-invalid');
  if (candidate.mode === 'catalog') {
    const policyHash = candidate?.policyHash;
    if (candidate.sources.length !== 0 || typeof policyHash !== 'string' || !/^[a-f\d]{64}$/i.test(policyHash) || typeof candidate.generatedAt !== 'string' || typeof candidate.quality !== 'object' || candidate.quality === null) throw new Error('candidate-invalid');
    return candidate;
  }
  if (candidate.mode !== 'enriched' || candidate.sources.length === 0 || !config || config.minimumWeightCoverage !== 0.7 || config.minimumValidFactors !== 4 || config.factors?.length !== 6) throw new Error('candidate-invalid');
  try {
    const sources = candidate.sources.map((source) => { const approved = getVerifiedSource(source?.sourceId, root); if (JSON.stringify(approved) !== JSON.stringify(source)) throw new Error(); return approved; });
    if (new Set(sources.map((source) => source.sourceId)).size !== sources.length) throw new Error();
  } catch {
    throw new Error('candidate-invalid');
  }
  return candidate;
}

const referenced = (pointer, label, snapshotRoot) => {
  const snapshotFile = pointerFile(pointer.snapshotPath, snapshotRoot), manifestFile = pointerFile(pointer.manifestPath, snapshotRoot);
  try {
    const snapshot = JSON.parse(readFileSync(snapshotFile, 'utf8')), manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    if (snapshot.snapshotId !== pointer.snapshotId || manifest.snapshotId !== pointer.snapshotId || (manifest.manifestId ?? manifest.snapshotId) !== pointer.manifestId || snapshot.schemaVersion !== pointer.schemaVersion || manifest.schemaVersion !== pointer.schemaVersion || fileHash(snapshotFile) !== pointer.snapshotSha256 || fileHash(manifestFile) !== pointer.manifestSha256 || manifest.snapshotSha256 !== pointer.snapshotSha256) throw new Error();
  } catch {
    throw new Error(`${label}-pointer-invalid`);
  }
  return { snapshotFile, manifestFile };
};

let stageSequence = 0;
const stagePath = (file, label) => `${file}.${label}.stage-${process.pid}-${stageSequence += 1}`;
const removeIfPresent = (file) => { try { unlinkSync(file); } catch { /* best effort cleanup */ } };
const readOptionalPointer = (file, label, snapshotRoot) => {
  if (!existsSync(file)) return null;
  try {
    const raw = readFileSync(file, 'utf8');
    const pointer = validatePointer(JSON.parse(raw), label, process.cwd(), snapshotRoot);
    referenced(pointer, label, snapshotRoot);
    return raw;
  } catch (error) {
    if (error?.message === `${label}-pointer-invalid`) throw error;
    throw new Error(`${label}-pointer-invalid`);
  }
};
const restore = (file, raw) => {
  if (raw === null) { removeIfPresent(file); return; }
  const staged = stagePath(file, 'restore');
  writeFileSync(staged, raw, 'utf8');
  renameSync(staged, file);
};

export function publishCandidate({ candidatePath, candidatePointerPath, currentPointerPath, previousPointerPath, root = process.cwd(), snapshotRoot = resolve(root, 'src/data/generated/ondo') }) {
  if (!publicationTarget(currentPointerPath, snapshotRoot) || !publicationTarget(previousPointerPath, snapshotRoot)) throw new Error('publication-path-invalid');
  const candidate = json(candidatePath, 'candidate');
  const candidatePointer = json(candidatePointerPath, 'candidate');
  validateCandidate(candidate, root);
  validatePointer(candidatePointer, 'candidate', root, snapshotRoot);
  if (candidatePointer.snapshotId !== candidate.snapshotId) throw new Error('candidate-invalid');
  referenced(candidatePointer, 'candidate', snapshotRoot);
  const currentRaw = readOptionalPointer(currentPointerPath, 'current', snapshotRoot);
  const previousRaw = readOptionalPointer(previousPointerPath, 'previous', snapshotRoot);
  const stagedCurrent = stagePath(currentPointerPath, 'current');
  const stagedPrevious = stagePath(previousPointerPath, 'previous');
  let previousReplaced = false;
  try {
    writeFileSync(stagedCurrent, JSON.stringify(candidatePointer), 'utf8');
    if (currentRaw !== null) { writeFileSync(stagedPrevious, currentRaw, 'utf8'); renameSync(stagedPrevious, previousPointerPath); previousReplaced = true; }
    renameSync(stagedCurrent, currentPointerPath);
    return { publication: 'valid' };
  } catch (error) {
    removeIfPresent(stagedCurrent); removeIfPresent(stagedPrevious);
    if (previousReplaced) { try { restore(previousPointerPath, previousRaw); } catch { /* fail closed */ } }
    throw Object.assign(new Error('publication-failed'), { cause: error });
  } finally { removeIfPresent(stagedCurrent); removeIfPresent(stagedPrevious); }
}
