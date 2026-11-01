// Core domain type definitions for Label Padho per PRD Section 5.

export type AllergenState = 'CONTAINS' | 'MAY_CONTAIN' | 'NOT_DECLARED_IN_TEXT';

export interface AllergenInfo {
  allergen: string;
  state: AllergenState;
}

export interface ParsedIngredient {
  raw: string;
  name: string;
  normalizedName: string;
  percentage: number | null;
  insCode: string | null;
  children: ParsedIngredient[];
}

export interface NutritionPer100g {
  energyKcal: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  addedSugars: number | null;
  protein: number | null;
  sodium: number | null;
  salt: number | null;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  ingredientsText: string;
  parsedIngredients: ParsedIngredient[];
  allergens: AllergenInfo[];
  nutrition: NutritionPer100g;
  createdAt: string;
  updatedAt: string;
}

export interface DictionaryEntry {
  id: string;
  names: string[];
  insCode: string | null;
  category: string;
  description: string;
  purpose: string;
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
}

export interface MatchedResult {
  status: 'Matched';
  matchType: 'exact_alias' | 'normalized_alias' | 'ins_code';
  entry: DictionaryEntry;
}

export interface UnidentifiedResult {
  status: 'Unidentified';
}

export type MatchResult = MatchedResult | UnidentifiedResult;


