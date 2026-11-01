// Database client initialization and migration runner per PRD Section 5.

import { MIGRATIONS } from './schema';

export interface DatabaseClient {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
}

let activeDb: DatabaseClient | null = null;

/**
 * Runs pending schema migrations against the database.
 * Why needed: Automatically brings SQLite tables to the latest version on launch.
 */
export async function runMigrations(db: DatabaseClient): Promise<void> {
  // Ensure schema_version table exists first
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );`
  );

  const appliedRows = await db.getAllAsync<{ version: number }>('SELECT version FROM schema_version');
  const appliedVersions = new Set(appliedRows.map(r => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      for (const statement of migration.up) {
        await db.execAsync(statement);
      }
      await db.runAsync(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
        migration.version,
        new Date().toISOString()
      );
    }
  }
}

/**
 * Initializes and returns the active database connection.
 * Why needed: Single point of entry for SQLite database lifecycle in the app.
 */
export async function getDatabase(customClient?: DatabaseClient): Promise<DatabaseClient> {
  if (customClient) {
    await runMigrations(customClient);
    return customClient;
  }

  if (!activeDb) {
    const SQLite = await import('expo-sqlite');
    const nativeDb = await SQLite.openDatabaseAsync('labelpadho.db');
    await runMigrations(nativeDb as unknown as DatabaseClient);
    activeDb = nativeDb as unknown as DatabaseClient;
  }

  return activeDb;
}
