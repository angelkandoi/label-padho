// Unit tests for nutritionFormatter pure domain logic per PRD Section 3.

import { formatNutrition, formatDisplayValue } from '../nutritionFormatter';

describe('nutritionFormatter', () => {
  it('extracts nutrition per 100 g and keeps null for missing values', () => {
    const rawNutriments = {
      'energy-kcal_100g': 480,
      'fat_100g': 20.5,
      'saturated-fat_100g': 9.8,
      'carbohydrates_100g': 65.0,
      'sugars_100g': 24.0,
      'proteins_100g': 7.2,
      'sodium_100g': 0.35,
      'salt_100g': 0.88,
    };

    const formatted = formatNutrition(rawNutriments);

    expect(formatted.energyKcal).toBe(480);
    expect(formatted.fat).toBe(20.5);
    expect(formatted.saturatedFat).toBe(9.8);
    expect(formatted.carbohydrates).toBe(65);
    expect(formatted.sugars).toBe(24);
    expect(formatted.addedSugars).toBeNull(); // Missing must be null, not 0
    expect(formatted.protein).toBe(7.2);
    expect(formatted.sodium).toBe(0.35);
    expect(formatted.salt).toBe(0.88);
  });

  it('never turns null or undefined or empty into zero', () => {
    const rawNutriments = {};
    const formatted = formatNutrition(rawNutriments);

    expect(formatted.energyKcal).toBeNull();
    expect(formatted.fat).toBeNull();
    expect(formatted.saturatedFat).toBeNull();
    expect(formatted.carbohydrates).toBeNull();
    expect(formatted.sugars).toBeNull();
    expect(formatted.addedSugars).toBeNull();
    expect(formatted.protein).toBeNull();
    expect(formatted.sodium).toBeNull();
    expect(formatted.salt).toBeNull();
  });

  it('formats display value as "Not available" when value is null', () => {
    expect(formatDisplayValue(null, 'g')).toBe('Not available');
    expect(formatDisplayValue(undefined as unknown as null, 'g')).toBe('Not available');
    expect(formatDisplayValue(0, 'g')).toBe('0 g');
    expect(formatDisplayValue(12.5, 'g')).toBe('12.5 g');
    expect(formatDisplayValue(450, 'kcal')).toBe('450 kcal');
  });
});

