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
    energyKcal: extractNutrient(rawNutriments['energy-kcal_100g'] ?? rawNutriments['energy-kcal']),
    fat: extractNutrient(rawNutriments['fat_100g']),
    saturatedFat: extractNutrient(rawNutriments['saturated-fat_100g']),
    carbohydrates: extractNutrient(rawNutriments['carbohydrates_100g']),
    sugars: extractNutrient(rawNutriments['sugars_100g']),
    addedSugars: extractNutrient(rawNutriments['added-sugars_100g']),
    protein: extractNutrient(rawNutriments['proteins_100g']),
    sodium: extractNutrient(rawNutriments['sodium_100g']),
    salt: extractNutrient(rawNutriments['salt_100g']),
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

