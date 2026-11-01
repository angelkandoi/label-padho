// Database schema definitions and migrations per PRD Section 5 and Decision 004.

export const CURRENT_SCHEMA_VERSION = 1;

export interface Migration {
  version: number;
  up: string[];
}

/**
 * Versioned database migrations.
 * Why needed: Ensures atomic, predictable database schema versioning across app updates.
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS products (
        barcode TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        ingredients_text TEXT,
        parsed_ingredients_json TEXT,
        allergens_json TEXT,
        nutrition_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);`,
      `CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        FOREIGN KEY (barcode) REFERENCES products (barcode) ON DELETE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history (scanned_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_scan_history_barcode ON scan_history (barcode);`,
    ],
  },
];

