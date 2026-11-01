// Unit tests for ingredientParser pure domain logic per PRD Section 3.

import { parseIngredients } from '../ingredientParser';

describe('ingredientParser', () => {
  it('returns empty array on empty input or whitespace', () => {
    expect(parseIngredients('')).toEqual([]);
    expect(parseIngredients('   ')).toEqual([]);
    expect(parseIngredients(null as unknown as string)).toEqual([]);
  });

  it('splits simple ingredients on commas at depth 0', () => {
    const text = 'Wheat flour, Sugar, Palm oil, Salt';
    const result = parseIngredients(text);
    expect(result).toHaveLength(4);
    expect(result.map(r => r.name)).toEqual(['Wheat flour', 'Sugar', 'Palm oil', 'Salt']);
    expect(result.map(r => r.normalizedName)).toEqual(['wheat flour', 'sugar', 'palm oil', 'salt']);
  });

  it('splits on semicolons as well as commas', () => {
    const text = 'Sugar; Cocoa butter; Whole milk powder, Vanilla';
    const result = parseIngredients(text);
    expect(result).toHaveLength(4);
    expect(result.map(r => r.name)).toEqual(['Sugar', 'Cocoa butter', 'Whole milk powder', 'Vanilla']);
  });

  it('respects bracket depth 0 and does not split commas inside brackets', () => {
    const text = 'Wheat flour (53%), Emulsifiers (INS 471, INS 322), Salt';
    const result = parseIngredients(text);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Wheat flour');
    expect(result[0].percentage).toBe(53);
    expect(result[1].name).toBe('Emulsifiers');
    expect(result[1].children).toHaveLength(2);
    expect(result[1].children[0].name).toBe('INS 471');
    expect(result[1].children[0].insCode).toBe('471');
    expect(result[1].children[1].name).toBe('INS 322');
    expect(result[1].children[1].insCode).toBe('322');
    expect(result[2].name).toBe('Salt');
  });

  it('extracts percentage correctly', () => {
    const text = 'Whole wheat (62.5%), Milk solids (4.2%)';
    const result = parseIngredients(text);
    expect(result[0].percentage).toBe(62.5);
    expect(result[1].percentage).toBe(4.2);
  });

  it('extracts INS and E codes with alphanumeric subcodes', () => {
    const text = 'Acidity regulator (INS 330), Raising agent (INS 500(ii)), Colour (E150d)';
    const result = parseIngredients(text);
    expect(result[0].children[0].insCode).toBe('330');
    expect(result[1].children[0].insCode).toBe('500(ii)');
    expect(result[2].children[0].insCode).toBe('150d');
  });

  it('collapses excessive whitespace and preserves original raw text', () => {
    const text = '  Refined   wheat   flour   (Maida)  ,   Iodised   salt  ';
    const result = parseIngredients(text);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Refined wheat flour');
    expect(result[0].children[0].name).toBe('Maida');
    expect(result[1].name).toBe('Iodised salt');
  });
});

