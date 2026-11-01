// Unit tests for ingredientMatcher pure domain logic per PRD Section 3 and Section 9 Block 3.

import { matchIngredient } from '../ingredientMatcher';
import { ParsedIngredient } from '../../types';

describe('ingredientMatcher', () => {
  it('matches by exact alias', () => {
    const ingredient: ParsedIngredient = {
      raw: 'citric acid',
      name: 'citric acid',
      normalizedName: 'citric acid',
      percentage: null,
      insCode: null,
      children: [],
    };

    const result = matchIngredient(ingredient);
    expect(result.status).toBe('Matched');
    if (result.status === 'Matched') {
      expect(result.entry.id).toBe('citric-acid');
      expect(result.matchType).toBe('exact_alias');
    }
  });

  it('matches by normalized alias with case and spacing variations', () => {
    const ingredient: ParsedIngredient = {
      raw: '  Refined  Wheat  Flour  ',
      name: 'Refined Wheat Flour',
      normalizedName: 'refined wheat flour',
      percentage: null,
      insCode: null,
      children: [],
    };

    const result = matchIngredient(ingredient);
    expect(result.status).toBe('Matched');
    if (result.status === 'Matched') {
      expect(result.entry.id).toBe('refined-wheat-flour');
      expect(result.matchType).toBe('normalized_alias');
    }
  });

  it('matches by INS code when name does not match an alias', () => {
    const ingredient: ParsedIngredient = {
      raw: 'Acidity regulator (INS 330)',
      name: 'Acidity regulator',
      normalizedName: 'acidity regulator',
      percentage: null,
      insCode: '330',
      children: [],
    };

    const result = matchIngredient(ingredient);
    expect(result.status).toBe('Matched');
    if (result.status === 'Matched') {
      expect(result.entry.id).toBe('citric-acid');
      expect(result.matchType).toBe('ins_code');
    }
  });

  it('matches alphanumeric INS codes with bracketed suffixes', () => {
    const ingredient: ParsedIngredient = {
      raw: 'Raising agent (500(ii))',
      name: 'Raising agent',
      normalizedName: 'raising agent',
      percentage: null,
      insCode: '500(ii)',
      children: [],
    };

    const result = matchIngredient(ingredient);
    expect(result.status).toBe('Matched');
    if (result.status === 'Matched') {
      expect(result.entry.id).toBe('sodium-bicarbonate');
      expect(result.matchType).toBe('ins_code');
    }
  });

  it('returns Unidentified for ingredients not in reference list', () => {
    const ingredient: ParsedIngredient = {
      raw: 'Dragonfruit extract',
      name: 'Dragonfruit extract',
      normalizedName: 'dragonfruit extract',
      percentage: null,
      insCode: null,
      children: [],
    };

    const result = matchIngredient(ingredient);
    expect(result.status).toBe('Unidentified');
  });

  it('never uses fuzzy matching on mistyped names', () => {
    const ingredient: ParsedIngredient = {
      raw: 'Citrick Asid',
      name: 'Citrick Asid',
      normalizedName: 'citrick asid',
      percentage: null,
      insCode: null,
      children: [],
    };

    const result = matchIngredient(ingredient);
    expect(result.status).toBe('Unidentified');
  });
});

