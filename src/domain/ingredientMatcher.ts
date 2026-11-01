// Pure domain ingredient matcher querying ingredients.json per PRD Section 3 and Section 9 Block 3.

import { DictionaryEntry, MatchResult, ParsedIngredient } from '../types';
import dictionaryData from '../data/ingredients.json';

const dictionary: DictionaryEntry[] = dictionaryData as DictionaryEntry[];

/**
 * Normalizes string for strict matching by lowercasing and collapsing whitespace.
 * Why needed: Ensures consistent lookup key comparison without fuzzy guesswork.
 */
function normalizeForMatch(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes INS/E code string for uniform comparison.
 * Why needed: Strips "ins" and "e" prefixes to match raw number/subcode directly.
 */
function normalizeInsCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.toLowerCase().replace(/^(?:ins|e)\s*/i, '').replace(/\s+/g, '').trim();
}

/**
 * Matches a parsed ingredient against the static dictionary.
 * Why needed: Maps user-scanned ingredients to verified additive information and purposes.
 */
export function matchIngredient(ingredient: ParsedIngredient): MatchResult {
  const rawLower = ingredient.raw.trim();
  const normalizedName = normalizeForMatch(ingredient.name);
  const targetIns = normalizeInsCode(ingredient.insCode);

  // 1. Exact alias match
  for (const entry of dictionary) {
    if (entry.names.includes(rawLower)) {
      return {
        status: 'Matched',
        matchType: 'exact_alias',
        entry,
      };
    }
  }

  // 2. Normalized alias match
  for (const entry of dictionary) {
    const hasNormalizedAlias = entry.names.some(
      alias => normalizeForMatch(alias) === normalizedName
    );
    if (hasNormalizedAlias) {
      return {
        status: 'Matched',
        matchType: 'normalized_alias',
        entry,
      };
    }
  }

  // 3. INS or E code match
  if (targetIns) {
    for (const entry of dictionary) {
      const entryIns = normalizeInsCode(entry.insCode);
      if (entryIns && entryIns === targetIns) {
        return {
          status: 'Matched',
          matchType: 'ins_code',
          entry,
        };
      }
    }
  }

  // 4. Also check if the raw ingredient name contains an INS code that matches
  const extractedFromRaw = normalizeInsCode(ingredient.raw);
  if (extractedFromRaw) {
    for (const entry of dictionary) {
      const entryIns = normalizeInsCode(entry.insCode);
      if (entryIns && entryIns === extractedFromRaw) {
        return {
          status: 'Matched',
          matchType: 'ins_code',
          entry,
        };
      }
    }
  }

  return { status: 'Unidentified' };
}

/**
 * Returns the entire verified dictionary.
 * Why needed: Supplies reference list for UI exploration and search.
 */
export function getAllDictionaryEntries(): DictionaryEntry[] {
  return dictionary;
}

