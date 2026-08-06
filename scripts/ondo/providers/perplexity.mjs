/**
 * Perplexity Web classification provider loader.
 *
 * The `perplexity-classification` source records that each tokenized asset's
 * canonical underlying identity (ticker) and coarse classification were
 * derived from Perplexity web research (via the `pwm` CLI) with cited sources,
 * for personal, non-redistributed use. The provider exposes a normalize hook
 * for future update flows; the enrichment script parses the replayable
 * evidence fixture directly.
 */
export const PROVIDER = 'perplexity';

export function normalize(payload) {
  return payload;
}

export async function fetch() {
  throw new Error('perplexity-live-fetch-not-supported');
}