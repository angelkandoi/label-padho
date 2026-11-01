// Pure domain normalizer converting Open Food Facts JSON to Product per PRD Section 3.

import { Product } from '../types';
import { parseIngredients } from './ingredientParser';
import { detectAllergens } from './allergenDetector';
import { formatNutrition } from './nutritionFormatter';

interface RawOffResponse {
  code?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    nutriments?: Record<string, unknown>;
  };
}

/**
 * Normalizes an Open Food Facts API response into our internal Product type.
 * Why needed: Insulates the rest of the application from external API structure variations and null fields.
 */
export function normalizeProduct(raw: RawOffResponse): Product {
  const barcode = String(raw?.code || '').trim();
  const rawProduct = raw?.product || {};

  const name = (rawProduct.product_name || rawProduct.product_name_en || '').trim() || 'Unknown Product';
  const brand = (rawProduct.brands || '').trim();
  const ingredientsText = (rawProduct.ingredients_text || rawProduct.ingredients_text_en || '').trim();

  const parsedIngredients = parseIngredients(ingredientsText);
  const allergens = detectAllergens(ingredientsText, parsedIngredients);
  const nutrition = formatNutrition(rawProduct.nutriments);

  const now = new Date().toISOString();

  return {
    barcode,
    name,
    brand,
    ingredientsText,
    parsedIngredients,
    allergens,
    nutrition,
    createdAt: now,
    updatedAt: now,
  };
}

