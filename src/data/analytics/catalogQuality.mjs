const numericFields = ['marketCap', 'holders'];

const availabilityFor = (state) => state === 'available' ? 'available' : state === 'catalog-source-missing' ? 'missing' : 'invalid';

export const qualityStatesForAsset = (asset) => {
  const states = [];
  const marketCapState = asset?.marketCapState ?? asset?.marketCap?.state;
  const holdersState = asset?.holdersState ?? asset?.holders?.state;
  if (asset?.identityState !== 'verified') states.push('unresolved-identity');
  if (asset?.rowStatus === 'display-duplicate-unresolved') states.push('display-duplicate');
  if (asset?.rowStatus === 'partial') states.push('partial');
  if ([marketCapState, holdersState].some((state) => state === 'missing' || state === 'unresolved')) states.push('missing-numeric');
  if ([marketCapState, holdersState].some((state) => state === 'malformed')) states.push('malformed-numeric');
  if (asset?.rowStatus === 'invalid') states.push('invalid-row');
  return states;
};

export const summarizeCatalogQuality = (rows, source = 'ontonew.md', state = rows.length ? 'available' : 'catalog-source-malformed') => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const fields = safeRows.flatMap((row) => numericFields.map((key) => row?.[key]));
  const duplicateRows = safeRows.filter((row) => row?.rowStatus === 'display-duplicate-unresolved');
  const duplicateDisplayKeys = new Set(duplicateRows.map((row) => String(row.contractAddressRaw ?? '').trim().toLowerCase()).filter(Boolean));

  return {
    source,
    state,
    availability: availabilityFor(state),
    reason: state === 'available' ? null : state,
    asOf: null,
    rowCount: safeRows.length,
    unresolvedIdentityCount: safeRows.filter((row) => row?.identityState !== 'verified').length,
    unavailableFieldCount: fields.filter((field) => field?.value == null).length,
    missingFieldCount: fields.filter((field) => field?.state === 'missing').length,
    malformedFieldCount: fields.filter((field) => field?.state === 'malformed').length,
    duplicateDisplayRowCount: duplicateRows.length,
    duplicateDisplayGroupCount: duplicateDisplayKeys.size,
    validRowCount: safeRows.filter((row) => row?.rowStatus === 'valid').length,
    partialRowCount: safeRows.filter((row) => row?.rowStatus === 'partial').length,
    invalidRowCount: safeRows.filter((row) => row?.rowStatus === 'invalid').length,
  };
};
