// Product SQLite repository using parameterized queries per PRD Section 5.

import { DatabaseClient } from './db';
import { Product } from '../types';

interface ProductRow {
  barcode: string;
  name: string;
  brand: string | null;
  ingredients_text: string | null;
  parsed_ingredients_json: string | null;
  allergens_json: string | null;
  nutrition_json: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Saves or updates a product in SQLite.
 * Why needed: Caches product metadata for instant offline reading upon subsequent scans.
 */
export async function saveProduct(db: DatabaseClient, product: Product): Promise<void> {
  const query = `
    INSERT INTO products (
      barcode, name, brand, ingredients_text,
      parsed_ingredients_json, allergens_json, nutrition_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(barcode) DO UPDATE SET
      name = excluded.name,
      brand = excluded.brand,
      ingredients_text = excluded.ingredients_text,
      parsed_ingredients_json = excluded.parsed_ingredients_json,
      allergens_json = excluded.allergens_json,
      nutrition_json = excluded.nutrition_json,
      updated_at = excluded.updated_at;
  `;

  await db.runAsync(
    query,
    product.barcode,
    product.name,
    product.brand,
    product.ingredientsText,
    JSON.stringify(product.parsedIngredients),
    JSON.stringify(product.allergens),
    JSON.stringify(product.nutrition),
    product.createdAt,
    product.updatedAt
  );
}

/**
 * Retrieves a product by barcode from SQLite.
 * Why needed: Enables offline retrieval of previously scanned items.
 */
export async function getProductByBarcode(db: DatabaseClient, barcode: string): Promise<Product | null> {
  const query = 'SELECT * FROM products WHERE barcode = ? LIMIT 1;';
  const row = await db.getFirstAsync<ProductRow>(query, barcode.trim());

  if (!row) {
    return null;
  }

  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand || '',
    ingredientsText: row.ingredients_text || '',
    parsedIngredients: row.parsed_ingredients_json ? JSON.parse(row.parsed_ingredients_json) : [],
    allergens: row.allergens_json ? JSON.parse(row.allergens_json) : [],
    nutrition: row.nutrition_json ? JSON.parse(row.nutrition_json) : {
      energyKcal: null,
      fat: null,
      saturatedFat: null,
      carbohydrates: null,
      sugars: null,
      addedSugars: null,
      protein: null,
      sodium: null,
      salt: null,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

