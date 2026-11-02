// Unit tests for product lookup API, offline cache, and error formats per PRD Section 3 & 5.

import { fetchProduct, OPEN_FOOD_FACTS_ATTRIBUTION } from '../productApi';
import { DatabaseClient } from '../../database/db';
import { Product } from '../../types';
import nutellaFixture from './fixtures/nutella.json';

describe('productApi', () => {
  it('defines correct Open Food Facts attribution string', () => {
    expect(OPEN_FOOD_FACTS_ATTRIBUTION).toBe('Product data from Open Food Facts, licensed under ODbL');
  });

  it('rejects invalid barcode before making any network call', async () => {
    const mockFetch = jest.fn();
    const result = await fetchProduct('8901030925541', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    expect(result.error?.kind).toBe('INVALID_BARCODE');
    expect(result.error?.message).toBe('Invalid barcode.');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches and normalizes a product successfully with valid barcode', async () => {
    const mockPayload = {
      status: 1,
      code: '8901030925542',
      product: {
        product_name: 'Good Day Butter Cookies',
        brands: 'Britannia',
        ingredients_text: 'Refined Wheat Flour, Sugar, Butter (2%), Salt.',
        nutriments: {
          'energy-kcal_100g': 492,
          'fat_100g': 22.0,
          'proteins_100g': 6.5,
        },
      },
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as unknown as Response);

    const result = await fetchProduct('8901030925542', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(true);
    expect(result.product?.barcode).toBe('8901030925542');
    expect(result.product?.name).toBe('Good Day Butter Cookies');
    expect(result.product?.brand).toBe('Britannia');
    expect(result.source).toBe('network');
  });

  it('normalizes Nutella fixture preserving all parsed ingredients and full nutrition', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => nutellaFixture,
    } as unknown as Response);

    const result = await fetchProduct('3017620422003', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(true);
    expect(result.product?.name).toBe('Nutella');
    expect(result.product?.parsedIngredients).toHaveLength(2);
    expect(result.product?.parsedIngredients[0].name).toBe('sugar');
    expect(result.product?.parsedIngredients[1].name).toBe('palm oil');

    // Nutrition values extracted per 100g
    expect(result.product?.nutrition.energyKcal).toBe(539);
    expect(result.product?.nutrition.fat).toBe(30.9);
    expect(result.product?.nutrition.saturatedFat).toBe(10.6);
    expect(result.product?.nutrition.carbohydrates).toBe(57.5);
    expect(result.product?.nutrition.sugars).toBe(56.3);
    expect(result.product?.nutrition.protein).toBe(6.3);
    expect(result.product?.nutrition.salt).toBe(0.107);
    expect(result.product?.nutrition.addedSugars).toBeNull(); // Missing must be null, not 0
  });

  it('handles 404 not found response with actionable paste message', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ status: 0 }),
    } as unknown as Response);

    const result = await fetchProduct('4006381333939', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    // Invalid check digit rejected before network
    expect(result.error?.kind).toBe('INVALID_BARCODE');

    // Now test with valid check digit that 404s
    const notFoundResult = await fetchProduct('4006381333931', undefined, mockFetch as unknown as typeof fetch);
    expect(notFoundResult.success).toBe(false);
    expect(notFoundResult.error?.kind).toBe('NOT_FOUND');
    expect(notFoundResult.error?.message).toBe(
      'This product is not in Open Food Facts yet. You can paste the ingredient text instead.'
    );
  });

  it('handles server errors gracefully', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as unknown as Response);

    const result = await fetchProduct('8901030925542', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    expect(result.error?.kind).toBe('SERVER_ERROR');
  });

  it('falls back to SQLite cache when network fetch fails', async () => {
    const mockProduct: Product = {
      barcode: '8901030925542',
      name: 'Good Day Butter Cookies',
      brand: 'Britannia',
      ingredientsText: 'Flour, Sugar, Butter',
      parsedIngredients: [],
      allergens: [],
      nutrition: {
        energyKcal: 492,
        fat: 22.0,
        saturatedFat: null,
        carbohydrates: null,
        sugars: null,
        addedSugars: null,
        protein: null,
        sodium: null,
        salt: null,
      },
      createdAt: '2026-11-01T20:00:00.000Z',
      updatedAt: '2026-11-01T20:00:00.000Z',
    };

    const mockDb: DatabaseClient = {
      execAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue({
        barcode: mockProduct.barcode,
        name: mockProduct.name,
        brand: mockProduct.brand,
        ingredients_text: mockProduct.ingredientsText,
        parsed_ingredients_json: '[]',
        allergens_json: '[]',
        nutrition_json: JSON.stringify(mockProduct.nutrition),
        created_at: mockProduct.createdAt,
        updated_at: mockProduct.updatedAt,
      }),
    };

    const mockFailingFetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await fetchProduct('8901030925542', mockDb, mockFailingFetch as unknown as typeof fetch);

    expect(result.success).toBe(true);
    expect(result.product?.name).toBe('Good Day Butter Cookies');
    expect(result.source).toBe('cache');
  });

  it('returns "This product needs internet the first time." when offline and not cached', async () => {
    const mockDb: DatabaseClient = {
      execAsync: jest.fn(),
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };

    const mockFailingFetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await fetchProduct('8901030925542', mockDb, mockFailingFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    expect(result.error?.kind).toBe('NEEDS_INTERNET');
    expect(result.error?.message).toBe('This product needs internet the first time.');
  });
});
