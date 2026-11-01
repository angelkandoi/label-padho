// Data deletion service implementing the DPDP "Delete all my data" requirement per PRD Section 7.

import { DatabaseClient } from './db';

/**
 * Empties all user data tables in SQLite.
 * Why needed: Fulfills DPDP compliance by letting users delete all cached products and scan history.
 */
export async function deleteAllData(db: DatabaseClient): Promise<void> {
  await db.execAsync('DELETE FROM scan_history;');
  await db.execAsync('DELETE FROM products;');
  await db.execAsync('VACUUM;');
}

