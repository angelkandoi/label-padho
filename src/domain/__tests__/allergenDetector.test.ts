// Unit tests for allergenDetector pure domain logic per PRD Section 3.

import { detectAllergens, CONTROLLED_ALLERGENS } from '../allergenDetector';
import { parseIngredients } from '../ingredientParser';

describe('allergenDetector', () => {
  it('covers all 11 controlled allergens', () => {
    expect(CONTROLLED_ALLERGENS).toEqual([
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
    ]);
  });

  it('detects CONTAINS from explicit allergen statement', () => {
    const text = 'Wheat flour, Sugar, Palm oil. Contains: Wheat, Milk and Soy.';
    const parsed = parseIngredients(text);
    const results = detectAllergens(text, parsed);

    const wheat = results.find(a => a.allergen === 'wheat or gluten');
    const milk = results.find(a => a.allergen === 'milk');
    const soy = results.find(a => a.allergen === 'soy');
    const peanut = results.find(a => a.allergen === 'peanut');

    expect(wheat?.state).toBe('CONTAINS');
    expect(milk?.state).toBe('CONTAINS');
    expect(soy?.state).toBe('CONTAINS');
    expect(peanut?.state).toBe('NOT_DECLARED_IN_TEXT');
  });

  it('detects MAY_CONTAIN from precautionary allergen statement', () => {
    const text = 'Sugar, Cocoa butter, Whole milk powder. May contain traces of Peanuts and Tree nuts.';
    const parsed = parseIngredients(text);
    const results = detectAllergens(text, parsed);

    const milk = results.find(a => a.allergen === 'milk');
    const peanut = results.find(a => a.allergen === 'peanut');
    const treeNuts = results.find(a => a.allergen === 'tree nuts');
    const egg = results.find(a => a.allergen === 'egg');

    expect(milk?.state).toBe('CONTAINS');
    expect(peanut?.state).toBe('MAY_CONTAIN');
    expect(treeNuts?.state).toBe('MAY_CONTAIN');
    expect(egg?.state).toBe('NOT_DECLARED_IN_TEXT');
  });

  it('detects CONTAINS when an allergen appears as a plain ingredient even without explicit statement', () => {
    const text = 'Potatoes, Edible vegetable oil, Mustard oil, Iodised salt';
    const parsed = parseIngredients(text);
    const results = detectAllergens(text, parsed);

    const mustard = results.find(a => a.allergen === 'mustard');
    expect(mustard?.state).toBe('CONTAINS');
  });

  it('handles both CONTAINS and MAY_CONTAIN in the same text without overlap conflict', () => {
    const text = 'Refined wheat flour, Cheese powder (Milk). Contains: Wheat, Milk. May contain: Soy, Sesame.';
    const parsed = parseIngredients(text);
    const results = detectAllergens(text, parsed);

    const wheat = results.find(a => a.allergen === 'wheat or gluten');
    const milk = results.find(a => a.allergen === 'milk');
    const soy = results.find(a => a.allergen === 'soy');
    const sesame = results.find(a => a.allergen === 'sesame');
    const fish = results.find(a => a.allergen === 'fish');

    expect(wheat?.state).toBe('CONTAINS');
    expect(milk?.state).toBe('CONTAINS');
    expect(soy?.state).toBe('MAY_CONTAIN');
    expect(sesame?.state).toBe('MAY_CONTAIN');
    expect(fish?.state).toBe('NOT_DECLARED_IN_TEXT');
  });

  it('marks all allergens as NOT_DECLARED_IN_TEXT when none are present', () => {
    const text = 'Apples, Water, Vitamin C';
    const parsed = parseIngredients(text);
    const results = detectAllergens(text, parsed);

    for (const r of results) {
      expect(r.state).toBe('NOT_DECLARED_IN_TEXT');
    }
  });
});

