// Unit tests for normalizer pure domain logic per PRD Section 3.

import { normalizeProduct } from '../normalizer';

describe('normalizer', () => {
  it('normalizes a full Open Food Facts response', () => {
    const raw = {
      code: '8901030925541',
      product: {
        product_name: 'Good Day Butter Cookies',
        brands: 'Britannia',
        ingredients_text: 'Refined Wheat Flour (Maida), Sugar, Refined Palm Oil, Butter (2%), Milk Solids, Salt. Contains Wheat, Milk.',
        nutriments: {
          'energy-kcal_100g': 492,
          'fat_100g': 22.0,
          'carbohydrates_100g': 67.0,
          'proteins_100g': 6.5,
        },
      },
    };

    const product = normalizeProduct(raw);

    expect(product.barcode).toBe('8901030925541');
    expect(product.name).toBe('Good Day Butter Cookies');
    expect(product.brand).toBe('Britannia');
    expect(product.parsedIngredients.length).toBeGreaterThan(0);
    expect(product.allergens.length).toBe(11);
    expect(product.nutrition.energyKcal).toBe(492);
    expect(product.nutrition.fat).toBe(22.0);
    expect(product.nutrition.sodium).toBeNull();
  });

  it('handles completely missing fields gracefully without crashing', () => {
    const raw = {
      code: '0000000000000',
      product: {},
    };

    const product = normalizeProduct(raw);

    expect(product.barcode).toBe('0000000000000');
    expect(product.name).toBe('Unknown Product');
    expect(product.brand).toBe('');
    expect(product.ingredientsText).toBe('');
    expect(product.parsedIngredients).toEqual([]);
    expect(product.nutrition.energyKcal).toBeNull();
  });
});

