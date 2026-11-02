// Pure domain nutrition formatter extracting 100g values honestly per PRD Section 3.

import { NutritionPer100g } from '../types';

/**
 * Extracts a numeric nutrition value for 100g or returns null.
 * Why needed: Ensures missing nutrition data stays null and is never misrepresented as zero.
 */
function extractNutrient(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats raw Open Food Facts nutriments dictionary into typed NutritionPer100g.
 * Why needed: Extracts standardized nutrients strictly per 100g.
 */
export function formatNutrition(rawNutriments: Record<string, unknown> | null | undefined): NutritionPer100g {
  if (!rawNutriments || typeof rawNutriments !== 'object') {
    return {
      energyKcal: null,
      fat: null,
      saturatedFat: null,
      carbohydrates: null,
      sugars: null,
      addedSugars: null,
      protein: null,
      sodium: null,
      salt: null,
    };
  }

  return {
    energyKcal: extractNutrient(rawNutriments['energy-kcal_100g'] ?? rawNutriments['energy-kcal_value'] ?? rawNutriments['energy-kcal']),
    fat: extractNutrient(rawNutriments['fat_100g'] ?? rawNutriments['fat_value'] ?? rawNutriments['fat']),
    saturatedFat: extractNutrient(rawNutriments['saturated-fat_100g'] ?? rawNutriments['saturated-fat_value'] ?? rawNutriments['saturated-fat']),
    carbohydrates: extractNutrient(rawNutriments['carbohydrates_100g'] ?? rawNutriments['carbohydrates_value'] ?? rawNutriments['carbohydrates']),
    sugars: extractNutrient(rawNutriments['sugars_100g'] ?? rawNutriments['sugars_value'] ?? rawNutriments['sugars']),
    addedSugars: extractNutrient(rawNutriments['added-sugars_100g'] ?? rawNutriments['added-sugars_value'] ?? rawNutriments['added-sugars']),
    protein: extractNutrient(rawNutriments['proteins_100g'] ?? rawNutriments['proteins_value'] ?? rawNutriments['protein_100g'] ?? rawNutriments['proteins']),
    sodium: extractNutrient(rawNutriments['sodium_100g'] ?? rawNutriments['sodium_value'] ?? rawNutriments['sodium']),
    salt: extractNutrient(rawNutriments['salt_100g'] ?? rawNutriments['salt_value'] ?? rawNutriments['salt']),
  };
}

/**
 * Formats a numeric nutrient value into a user-facing string.
 * Why needed: Strictly displays "Not available" when null, preventing false zero claims.
 */
export function formatDisplayValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) {
    return 'Not available';
  }
  return `${value} ${unit}`;
}

