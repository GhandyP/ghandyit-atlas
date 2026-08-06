import { readFileSync } from 'node:fs';
import { parseCatalogRows } from '../../src/data/analytics/catalogParser.mjs';
import { validateCandidate, validatePointer } from './update.mjs';

export function validatePublication(candidate, pointers = [], root = process.cwd(), snapshotRoot) { validateCandidate(candidate, root); pointers.forEach((pointer) => validatePointer(pointer, 'pointer', root, snapshotRoot)); return { publication: 'valid' }; }

export function validateCatalogFixture(file) {
  const payload = JSON.parse(readFileSync(file, 'utf8'));
  const rows = parseCatalogRows(payload.rows, 'catalog-parser-fixture');
  const statuses = Object.fromEntries([...new Set(rows.map((row) => row.rowStatus))].sort().map((status) => [status, rows.filter((row) => row.rowStatus === status).length]));
  if (!rows.length || new Set(rows.map((row) => row.rawRowKey)).size !== rows.length) throw new Error('catalog fixture has no rows or duplicate raw keys');
  return { rows: rows.length, statuses, unresolved: rows.filter((row) => row.identityState === 'unresolved').length };
}

if (process.argv[1]?.endsWith('/validate.mjs')) {
  const index = process.argv.indexOf('--catalog-fixture');
  if (index < 0 || !process.argv[index + 1]) throw new Error('usage: npm run data:validate -- --catalog-fixture <file>');
  console.log(JSON.stringify(validateCatalogFixture(process.argv[index + 1])));
}
