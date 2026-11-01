// Unit tests for SQLite migrations, repositories, and DPDP data wipe per PRD Section 4 & 5.

import { DatabaseClient, runMigrations } from '../db';
import { saveProduct, getProductByBarcode } from '../productRepository';
import { recordScan, getScanHistory } from '../historyRepository';
import { deleteAllData } from '../cleanup';
import { Product } from '../../types';

class MockDatabaseClient implements DatabaseClient {
  public executedQueries: { sql: string; params: unknown[] }[] = [];
  public tables: {
    schema_version: { version: number; applied_at: string }[];
    products: Map<string, Record<string, unknown>>;
    scan_history: { id: number; barcode: string; scanned_at: string }[];
  } = {
    schema_version: [],
    products: new Map(),
    scan_history: [],
  };
  private nextHistoryId = 1;

  async execAsync(sql: string): Promise<void> {
    const trimmed = sql.trim();
    this.executedQueries.push({ sql: trimmed, params: [] });
    if (trimmed === 'DELETE FROM scan_history;') {
      this.tables.scan_history = [];
    }
    if (trimmed === 'DELETE FROM products;') {
      this.tables.products.clear();
    }
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }> {
    const trimmed = sql.trim();
    this.executedQueries.push({ sql: trimmed, params });

    if (trimmed.startsWith('INSERT INTO schema_version')) {
      this.tables.schema_version.push({
        version: params[0] as number,
        applied_at: params[1] as string,
      });
      return { changes: 1, lastInsertRowId: this.tables.schema_version.length };
    }

    if (trimmed.startsWith('INSERT INTO products')) {
      const barcode = params[0] as string;
      this.tables.products.set(barcode, {
        barcode,
        name: params[1],
        brand: params[2],
        ingredients_text: params[3],
        parsed_ingredients_json: params[4],
        allergens_json: params[5],
        nutrition_json: params[6],
        created_at: params[7],
        updated_at: params[8],
      });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (trimmed.startsWith('INSERT INTO scan_history')) {
      const id = this.nextHistoryId++;
      this.tables.scan_history.push({
        id,
        barcode: params[0] as string,
        scanned_at: params[1] as string,
      });
      return { changes: 1, lastInsertRowId: id };
    }

    if (trimmed === 'DELETE FROM scan_history;') {
      const count = this.tables.scan_history.length;
      this.tables.scan_history = [];
      return { changes: count, lastInsertRowId: 0 };
    }

    if (trimmed === 'DELETE FROM products;') {
      const count = this.tables.products.size;
      this.tables.products.clear();
      return { changes: count, lastInsertRowId: 0 };
    }

    return { changes: 0, lastInsertRowId: 0 };
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const trimmed = sql.trim();
    this.executedQueries.push({ sql: trimmed, params });

    if (trimmed === 'SELECT version FROM schema_version') {
      return this.tables.schema_version as unknown as T[];
    }

    if (trimmed.includes('FROM scan_history h')) {
      const limit = (params[0] as number) || 50;
      const sorted = [...this.tables.scan_history].sort(
        (a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
      );
      const sliced = sorted.slice(0, limit);
      return sliced.map(h => {
        const prod = this.tables.products.get(h.barcode);
        return {
          id: h.id,
          barcode: h.barcode,
          name: prod ? prod.name : null,
          brand: prod ? prod.brand : null,
          scanned_at: h.scanned_at,
        };
      }) as unknown as T[];
    }

    return [];
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const trimmed = sql.trim();
    this.executedQueries.push({ sql: trimmed, params });

    if (trimmed.startsWith('SELECT * FROM products WHERE barcode = ?')) {
      const barcode = params[0] as string;
      const prod = this.tables.products.get(barcode);
      return (prod as unknown as T) || null;
    }

    return null;
  }
}

describe('SQLite Database Layer', () => {
  let db: MockDatabaseClient;

  const sampleProduct: Product = {
    barcode: '8901030925541',
    name: 'Good Day Butter Cookies',
    brand: 'Britannia',
    ingredientsText: 'Refined Wheat Flour, Sugar, Butter (2%), Salt.',
    parsedIngredients: [
      {
        raw: 'Refined Wheat Flour',
        name: 'Refined Wheat Flour',
        normalizedName: 'refined wheat flour',
        percentage: null,
        insCode: null,
        children: [],
      },
    ],
    allergens: [
      { allergen: 'wheat or gluten', state: 'CONTAINS' },
      { allergen: 'milk', state: 'CONTAINS' },
    ],
    nutrition: {
      energyKcal: 492,
      fat: 22.0,
      saturatedFat: 9.5,
      carbohydrates: 67.0,
      sugars: 24.0,
      addedSugars: null,
      protein: 6.5,
      sodium: 0.35,
      salt: 0.88,
    },
    createdAt: '2026-11-01T20:00:00.000Z',
    updatedAt: '2026-11-01T20:00:00.000Z',
  };

  beforeEach(() => {
    db = new MockDatabaseClient();
  });

  it('runs migrations and records schema version', async () => {
    await runMigrations(db);

    expect(db.tables.schema_version).toHaveLength(1);
    expect(db.tables.schema_version[0].version).toBe(1);

    // Running again does not duplicate migrations
    await runMigrations(db);
    expect(db.tables.schema_version).toHaveLength(1);
  });

  it('saves and retrieves a product with parameterised queries', async () => {
    await runMigrations(db);
    await saveProduct(db, sampleProduct);

    // Verify parameterised query was used
    const saveQuery = db.executedQueries.find(q => q.sql.includes('INSERT INTO products'));
    expect(saveQuery?.params).toContain(sampleProduct.barcode);
    expect(saveQuery?.params).toContain(sampleProduct.name);

    // Retrieve from database
    const retrieved = await getProductByBarcode(db, sampleProduct.barcode);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.barcode).toBe(sampleProduct.barcode);
    expect(retrieved?.name).toBe('Good Day Butter Cookies');
    expect(retrieved?.brand).toBe('Britannia');
    expect(retrieved?.parsedIngredients).toHaveLength(1);
    expect(retrieved?.allergens).toHaveLength(2);
    expect(retrieved?.nutrition.energyKcal).toBe(492);
  });

  it('updates an existing product on saving the same barcode', async () => {
    await runMigrations(db);
    await saveProduct(db, sampleProduct);

    const updatedProduct: Product = {
      ...sampleProduct,
      name: 'Good Day Rich Butter Cookies',
      updatedAt: '2026-11-01T21:00:00.000Z',
    };

    await saveProduct(db, updatedProduct);

    expect(db.tables.products.size).toBe(1);
    const retrieved = await getProductByBarcode(db, sampleProduct.barcode);
    expect(retrieved?.name).toBe('Good Day Rich Butter Cookies');
  });

  it('records scan events and retrieves scan history with joined product info', async () => {
    await runMigrations(db);
    await saveProduct(db, sampleProduct);

    await recordScan(db, sampleProduct.barcode);

    const history = await getScanHistory(db, 10);
    expect(history).toHaveLength(1);
    expect(history[0].barcode).toBe(sampleProduct.barcode);
    expect(history[0].name).toBe('Good Day Butter Cookies');
    expect(history[0].brand).toBe('Britannia');
  });

  it('empties all user data tables on deleteAllData', async () => {
    await runMigrations(db);
    await saveProduct(db, sampleProduct);
    await recordScan(db, sampleProduct.barcode);

    expect(db.tables.products.size).toBe(1);
    expect(db.tables.scan_history).toHaveLength(1);

    await deleteAllData(db);

    expect(db.tables.products.size).toBe(0);
    expect(db.tables.scan_history).toHaveLength(0);
  });
});

