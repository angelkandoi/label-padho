// Pure domain allergen detector evaluating 3 explicit states per PRD Section 3.

import { AllergenInfo, AllergenState, ParsedIngredient } from '../types';
import { parseIngredients } from './ingredientParser';

export const CONTROLLED_ALLERGENS: string[] = [
  'milk',
  'egg',
  'peanut',
  'tree nuts',
  'soy',
  'wheat or gluten',
  'fish',
  'crustacean',
  'sesame',
  'mustard',
  'sulphite',
];

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  'milk': ['milk', 'dairy', 'butter', 'cheese', 'whey', 'casein', 'curd', 'yoghurt', 'yogurt', 'paneer', 'lactose'],
  'egg': ['egg', 'eggs', 'albumin', 'ovalbumin', 'yolk', 'yolks'],
  'peanut': ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
  'tree nuts': ['almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'pecan', 'pecans', 'tree nut', 'tree nuts'],
  'soy': ['soy', 'soya', 'soybean', 'soybeans'],
  'wheat or gluten': ['wheat', 'maida', 'gluten', 'atta', 'suji', 'semolina', 'barley', 'rye', 'oats', 'oat'],
  'fish': ['fish', 'fishes', 'tuna', 'salmon', 'cod', 'anchovy', 'anchovies'],
  'crustacean': ['prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'crabs', 'lobster', 'lobsters', 'crustacean', 'crustaceans'],
  'sesame': ['sesame', 'sesame seed', 'sesame seeds', 'til'],
  'mustard': ['mustard', 'mustard seed', 'mustard seeds', 'sarson', 'rai'],
  'sulphite': ['sulphite', 'sulphites', 'sulfite', 'sulfites', 'sulphur dioxide', 'sulfur dioxide', 'metabisulphite', 'metabisulphites'],
};

/**
 * Checks if a given text contains any keywords for a specific allergen.
 * Why needed: Identifies allergen references in raw text or ingredient names.
 */
function textMatchesAllergen(text: string, allergen: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ALLERGEN_KEYWORDS[allergen] || [];
  return keywords.some(keyword => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(lower);
  });
}

/**
 * Traverses parsed ingredients hierarchy to check if any genuine ingredient references the allergen.
 * Why needed: Detects allergens present as plain ingredients even without an explicit declaration line.
 */
function ingredientTreeMatchesAllergen(ingredients: ParsedIngredient[], allergen: string): boolean {
  for (const item of ingredients) {
    if (textMatchesAllergen(item.name, allergen) || textMatchesAllergen(item.raw, allergen)) {
      return true;
    }
    if (item.children && item.children.length > 0) {
      if (ingredientTreeMatchesAllergen(item.children, allergen)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Detects allergen presence across all 11 controlled allergens with 3 distinct states.
 * Why needed: Satisfies the safety rule separating confirmed presence, potential cross-contact, and non-declaration.
 */
export function detectAllergens(fullText: string, parsedIngredients?: ParsedIngredient[]): AllergenInfo[] {
  const lowerFull = fullText.toLowerCase();

  // Separate true ingredients from explicit allergen declaration statements
  const disclaimerRegex = /\b(?:contains\s*:|may contain|allergen advice|allergen information|made in a facility|processed in a facility)/i;
  const disclaimerIndex = fullText.search(disclaimerRegex);
  const pureIngredientsText = disclaimerIndex >= 0 ? fullText.substring(0, disclaimerIndex) : fullText;
  const pureIngredients = parsedIngredients && disclaimerIndex < 0 ? parsedIngredients : parseIngredients(pureIngredientsText);

  // Extract explicit "Contains: ..." statement up to period or end
  const containsMatch = /(?:^|[^a-z])contains\s*[:\s]([^.]+)/i.exec(lowerFull);
  let containsSection = '';
  if (containsMatch) {
    const matchStart = containsMatch.index;
    const prefix = lowerFull.substring(Math.max(0, matchStart - 10), matchStart);
    if (!/may\s*$/i.test(prefix)) {
      containsSection = containsMatch[1];
    }
  }

  // Extract explicit "May contain ..." or precautionary statement up to period or end
  const mayContainMatch = /(?:may contain|made in a facility|processed in a facility|produced on equipment)(?:[^.]+)/i.exec(lowerFull);
  const mayContainSection = mayContainMatch ? mayContainMatch[0] : '';

  return CONTROLLED_ALLERGENS.map(allergen => {
    let state: AllergenState = 'NOT_DECLARED_IN_TEXT';

    // 1. Check explicit "Contains" section
    if (containsSection && textMatchesAllergen(containsSection, allergen)) {
      state = 'CONTAINS';
    }

    // 2. Check pure ingredients tree (excluding disclaimer statements)
    if (state !== 'CONTAINS' && ingredientTreeMatchesAllergen(pureIngredients, allergen)) {
      state = 'CONTAINS';
    }

    // 3. Check "May contain" section if not already marked CONTAINS
    if (state !== 'CONTAINS' && mayContainSection && textMatchesAllergen(mayContainSection, allergen)) {
      state = 'MAY_CONTAIN';
    }

    return { allergen, state };
  });
}
