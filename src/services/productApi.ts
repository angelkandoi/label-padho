// Open Food Facts API integration and offline SQLite cache service per PRD Section 3 & 5.

import { DatabaseClient } from '../database/db';
import { saveProduct, getProductByBarcode } from '../database/productRepository';
import { recordScan } from '../database/historyRepository';
import { normalizeProduct } from '../domain/normalizer';
import { validateBarcode } from './barcodeService';
import { Product } from '../types';
import { logger } from './logger';

export const OPEN_FOOD_FACTS_ATTRIBUTION = 'Product data from Open Food Facts, licensed under ODbL';
export const USER_AGENT = 'LabelPadho/1.0 (angelaggarwal2409@gmail.com)';
export const API_TIMEOUT_MS = 8000;

export type ProductErrorKind = 'NOT_FOUND' | 'TIMEOUT' | 'OFFLINE' | 'SERVER_ERROR' | 'NEEDS_INTERNET' | 'INVALID_BARCODE';

export interface ProductError {
  kind: ProductErrorKind;
  message: string;
}

export interface ProductResult {
  success: boolean;
  product?: Product;
  error?: ProductError;
  source?: 'network' | 'cache';
}

/**
 * Checks if an error is a network or offline error.
 * Why needed: Distinguishes connectivity failure from server or not found responses.
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return true;
  }
  if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('network'))) {
    return true;
  }
  return false;
}

/**
 * Fetches product metadata from Open Food Facts or local SQLite cache.
 * Why needed: Coordinates network fetching, timeout protection, offline fallback, and caching.
 */
export async function fetchProduct(
  barcode: string,
  db?: DatabaseClient,
  customFetch?: typeof fetch
): Promise<ProductResult> {
  const cleanedBarcode = barcode.trim();
  const validation = validateBarcode(cleanedBarcode);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        kind: 'INVALID_BARCODE',
        message: validation.error || 'Invalid barcode.',
      },
    };
  }

  const fetchFn = customFetch || fetch;

  const url = `https://world.openfoodfacts.org/api/v2/product/${cleanedBarcode}.json?fields=code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,nutriments`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const unrefable = timeoutId as unknown as { unref?: () => void };
  if (typeof unrefable.unref === 'function') {
    unrefable.unref();
  }

  try {
    logger.info(`Fetching product metadata for barcode ${cleanedBarcode}`);

    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      return {
        success: false,
        error: {
          kind: 'NOT_FOUND',
          message: 'This product is not in Open Food Facts yet. You can paste the ingredient text instead.',
        },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          kind: 'SERVER_ERROR',
          message: `Open Food Facts server error (${response.status}). Please try again later.`,
        },
      };
    }

    const json = await response.json();

    if (!json || json.status === 0 || !json.product) {
      return {
        success: false,
        error: {
          kind: 'NOT_FOUND',
          message: 'This product is not in Open Food Facts yet. You can paste the ingredient text instead.',
        },
      };
    }

    const product = normalizeProduct(json);

    // Cache to SQLite if database client provided
    if (db) {
      try {
        await saveProduct(db, product);
        await recordScan(db, product.barcode);
      } catch (dbError) {
        logger.error('Failed to cache product in SQLite', dbError);
      }
    }

    return {
      success: true,
      product,
      source: 'network',
    };
  } catch (error) {
    logger.warn(`Network fetch failed for barcode ${cleanedBarcode}`, error);

    // If database client is available, attempt offline lookup
    if (db) {
      try {
        const cached = await getProductByBarcode(db, cleanedBarcode);
        if (cached) {
          await recordScan(db, cached.barcode);
          return {
            success: true,
            product: cached,
            source: 'cache',
          };
        }
      } catch (cacheError) {
        logger.error('SQLite cache lookup failed', cacheError);
      }

      return {
        success: false,
        error: {
          kind: 'NEEDS_INTERNET',
          message: 'This product needs internet the first time.',
        },
      };
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          kind: 'TIMEOUT',
          message: 'Request timed out. Please check your internet connection and try again.',
        },
      };
    }

    if (isNetworkError(error)) {
      return {
        success: false,
        error: {
          kind: 'OFFLINE',
          message: 'Network offline. Connect to internet or scan a previously viewed product.',
        },
      };
    }

    return {
      success: false,
      error: {
        kind: 'SERVER_ERROR',
        message: 'An unexpected error occurred while looking up the product.',
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

