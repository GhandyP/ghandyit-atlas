export type NumericParseState = 'valid-positive' | 'valid-zero' | 'missing' | 'malformed' | 'unresolved';
export type CatalogRowStatus = 'valid' | 'partial' | 'invalid' | 'unresolved-identity' | 'display-duplicate-unresolved';
export type CatalogSourceState = 'available' | 'catalog-source-missing' | 'catalog-source-malformed';
export type ValueStatus = 'observed' | 'derived' | 'editorial' | 'unavailable';
export type Availability = 'available' | 'stale' | 'missing' | 'not-applicable' | 'unresolved' | 'invalid' | 'insufficient-history' | 'source-error' | 'license-blocked';
export type ReasonCode = 'no-generated-snapshot' | 'unknown-catalog-as-of' | 'truncated-identity' | 'identity-conflict' | 'source-not-verified' | 'license-not-approved' | 'field-not-present' | 'missing-value' | 'malformed-value' | 'insufficient-history' | 'provider-error';

export interface RawNumericField<T extends number = number> { raw: string | null; value: T | null; state: NumericParseState }
export interface ParsedCatalogRow {
  rawRowKey: string; sourceLine: number; rank: number | null;
  contractAddressRaw: string | null; tokenNameRaw: string | null; symbolRaw: string | null; websiteRaw: string | null;
  marketCap: RawNumericField; holders: RawNumericField;
  identityState: 'verified' | 'unresolved' | 'candidate-display-only'; addressIsTruncated: boolean;
  canonicalKey: string | null; rowStatus: CatalogRowStatus; validationErrors: string[];
}
export interface CatalogQuality {
  source: string;
  state: CatalogSourceState;
  availability: 'available' | 'missing' | 'invalid';
  reason: CatalogSourceState | null;
  asOf: string | null;
  rowCount: number;
  unresolvedIdentityCount: number;
  unavailableFieldCount: number;
  missingFieldCount: number;
  malformedFieldCount: number;
  duplicateDisplayRowCount: number;
  duplicateDisplayGroupCount: number;
  validRowCount: number;
  partialRowCount: number;
  invalidRowCount: number;
}
export interface Provenance { sourceId: string | null; sourceUrl: string | null; fieldPath: string | null; retrievedAt: string | null; asOf: string | null; methodVersion: string | null; inputIds: string[]; taxonomyVersion: string | null; rationale: string | null; confidence: 'high' | 'medium' | 'low' | null; reviewStatus: string | null }
export interface ValueEnvelope<T> { value: T | null; status: ValueStatus; availability: Availability; reason: ReasonCode | null; provenance: Provenance | null }
export interface CanonicalIdentity { state: 'verified' | 'unresolved' | 'conflict'; chain: string | null; address: string | null; normalizedAddress: string | null; stableId: string | null; evidence: Provenance[]; unresolvedReason: ReasonCode | null }
export interface MetricSemantics { quantity: string; unit: string; currency: string | null; venue: string | null; period: Record<string, unknown>; series: { kind: string; seriesId: string; instrumentId: string | null }; adjustment: Record<string, string>; sourceId: string | null; retrievedAt: string | null; asOf: string | null; cohortEligibility: { eligibleCohorts: string[]; cohortKey: string | null; comparabilityKey: string }; methodVersion: string | null }
export interface SemanticMetric<T> extends ValueEnvelope<T> { semantics: MetricSemantics }
export interface SourceRecord {
  sourceId: string; provider: string; kind: string; documentationUrl: string; exactUrl: string; apiVersion: string; verificationStatus: string; retrievedAt: string | null;
  request: { method: string; exactUrl: string; query: Record<string, string>; auth: Record<string, unknown> };
  response: { httpStatus: number | null; contentType?: string; responseFixturePath: string | null; responseSha256: string | null; redactionPolicy?: string };
  pagination?: Record<string, unknown>; rateLimit?: Record<string, unknown>;
  coverage: { chains: string[]; fullAddress: string; stableId: string };
  semantics: { temporal: string; seriesIdentity: string };
  failureBehavior: { publicationAction: string };
  licensing: { redistributionPermission: string; staticArtifactPermission: string };
  verification: { fixtureReplayable: boolean; blockers: string[] };
}
export interface AnalyticsSnapshot { schemaVersion: number; snapshotId: string; generatedAt: string | null; catalogSnapshotAt: string | null; mode: 'enriched' | 'catalog-fallback'; sources: SourceRecord[]; quality: Record<string, unknown>; assets: unknown[] }
