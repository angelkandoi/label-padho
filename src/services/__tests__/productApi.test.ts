// Unit tests for product lookup API, offline cache, and error formats per PRD Section 3 & 5.

import { fetchProduct, OPEN_FOOD_FACTS_ATTRIBUTION } from '../productApi';
import { DatabaseClient } from '../../database/db';
import { Product } from '../../types';

describe('productApi', () => {
  it('defines correct Open Food Facts attribution string', () => {
    expect(OPEN_FOOD_FACTS_ATTRIBUTION).toBe('Product data from Open Food Facts, licensed under ODbL');
  });

  it('fetches and normalizes a product successfully', async () => {
    const mockPayload = {
      status: 1,
      code: '8901030925541',
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

    const result = await fetchProduct('8901030925541', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(true);
    expect(result.product?.barcode).toBe('8901030925541');
    expect(result.product?.name).toBe('Good Day Butter Cookies');
    expect(result.product?.brand).toBe('Britannia');
    expect(result.source).toBe('network');
  });

  it('handles 404 not found response with clear error', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ status: 0 }),
    } as unknown as Response);

    const result = await fetchProduct('0000000000000', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    expect(result.error?.kind).toBe('NOT_FOUND');
  });

  it('handles server errors gracefully', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as unknown as Response);

    const result = await fetchProduct('8901030925541', undefined, mockFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    expect(result.error?.kind).toBe('SERVER_ERROR');
  });

  it('falls back to SQLite cache when network fetch fails', async () => {
    const mockProduct: Product = {
      barcode: '8901030925541',
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

    const result = await fetchProduct('8901030925541', mockDb, mockFailingFetch as unknown as typeof fetch);

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

    const result = await fetchProduct('8901030925541', mockDb, mockFailingFetch as unknown as typeof fetch);

    expect(result.success).toBe(false);
    expect(result.error?.kind).toBe('NEEDS_INTERNET');
    expect(result.error?.message).toBe('This product needs internet the first time.');
  });
});

