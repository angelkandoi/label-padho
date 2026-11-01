// Scan history SQLite repository using parameterized queries per PRD Section 5.

import { DatabaseClient } from './db';

export interface HistoryItem {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  scannedAt: string;
}

interface HistoryRow {
  id: number;
  barcode: string;
  name: string | null;
  brand: string | null;
  scanned_at: string;
}

/**
 * Records a scan event with current timestamp into scan_history.
 * Why needed: Powers the offline recent scans timeline.
 */
export async function recordScan(db: DatabaseClient, barcode: string): Promise<void> {
  const query = 'INSERT INTO scan_history (barcode, scanned_at) VALUES (?, ?);';
  await db.runAsync(query, barcode.trim(), new Date().toISOString());
}

/**
 * Retrieves recent scan history ordered by scan timestamp descending.
 * Why needed: Displays scan history on the History screen without network access.
 */
export async function getScanHistory(db: DatabaseClient, limit: number = 50): Promise<HistoryItem[]> {
  const query = `
    SELECT
      h.id,
      h.barcode,
      p.name,
      p.brand,
      h.scanned_at
    FROM scan_history h
    LEFT JOIN products p ON h.barcode = p.barcode
    ORDER BY h.scanned_at DESC
    LIMIT ?;
  `;

  const rows = await db.getAllAsync<HistoryRow>(query, limit);

  return rows.map(r => ({
    id: r.id,
    barcode: r.barcode,
    name: r.name || 'Unknown Product',
    brand: r.brand || '',
    scannedAt: r.scanned_at,
  }));
}

