// Pure domain ingredient parser for splitting and normalizing ingredients per PRD Section 3.

import { ParsedIngredient } from '../types';

/**
 * Splits input text on commas and semicolons only at bracket depth 0.
 * Why needed: Prevents splitting comma-separated items that belong inside nested parenthetical lists.
 */
export function splitAtDepthZero(input: string): string[] {
  const results: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      if (depth > 0) depth--;
      current += char;
    } else if ((char === ',' || char === ';') && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        results.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const finalTrimmed = current.trim();
  if (finalTrimmed.length > 0) {
    results.push(finalTrimmed);
  }

  return results;
}

/**
 * Extracts percentage number from text if present.
 * Why needed: Identifies ingredient composition percentages per pack label rules.
 */
export function extractPercentage(text: string): { percentage: number | null; cleanedText: string } {
  const percentRegex = /\(?\s*(\d+(?:\.\d+)?)\s*%\s*\)?/g;
  const match = percentRegex.exec(text);
  if (match) {
    const percentage = parseFloat(match[1]);
    const cleanedText = text.replace(percentRegex, ' ').replace(/\s+/g, ' ').trim();
    return { percentage, cleanedText };
  }
  return { percentage: null, cleanedText: text };
}

/**
 * Extracts INS or E code from ingredient text.
 * Why needed: Flags standard additive codes (e.g. INS 471, E322, 500(ii)) for dictionary lookup.
 */
export function extractInsCode(text: string): string | null {
  const insWithPrefix = /(?:INS|E)\s*([0-9]{3,4}[a-z]?(?:\([a-z0-9]+\))?)/i.exec(text);
  if (insWithPrefix) {
    return insWithPrefix[1].toLowerCase();
  }

  const standaloneIns = /^([0-9]{3,4}[a-z]?(?:\([a-z0-9]+\))?)$/i.exec(text.trim());
  if (standaloneIns) {
    return standaloneIns[1].toLowerCase();
  }

  return null;
}

/**
 * Parses a single ingredient fragment into a ParsedIngredient.
 * Why needed: Handles nested sub-ingredients in brackets recursively.
 */
function parseSingleFragment(rawSegment: string): ParsedIngredient {
  const collapsed = rawSegment.replace(/\s+/g, ' ').trim();
  const { percentage, cleanedText } = extractPercentage(collapsed);

  // If the segment itself is an INS code with suffix like "INS 500(ii)" or "500(ii)", do not treat the suffix as nested children
  const isInsWithSuffix = /^(?:INS\s*|E\s*)?[0-9]{3,4}[a-z]?(?:\([a-z0-9]+\))?$/i.test(cleanedText);
  if (isInsWithSuffix) {
    return {
      raw: rawSegment,
      name: cleanedText,
      normalizedName: cleanedText.toLowerCase(),
      percentage,
      insCode: extractInsCode(cleanedText),
      children: [],
    };
  }

  // Check for outermost bracket content: e.g. "Emulsifiers (INS 471, INS 322)"
  const bracketMatch = /^([^(]+?)\s*\((.+)\)\s*$/.exec(cleanedText);

  if (bracketMatch) {
    const parentName = bracketMatch[1].trim();
    const innerText = bracketMatch[2].trim();
    const childrenSegments = splitAtDepthZero(innerText);

    const children: ParsedIngredient[] = childrenSegments.map(child => parseSingleFragment(child));

    return {
      raw: rawSegment,
      name: parentName,
      normalizedName: parentName.toLowerCase(),
      percentage,
      insCode: extractInsCode(parentName),
      children,
    };
  }

  return {
    raw: rawSegment,
    name: cleanedText,
    normalizedName: cleanedText.toLowerCase(),
    percentage,
    insCode: extractInsCode(cleanedText),
    children: [],
  };
}

/**
 * Main ingredient parser entry point.
 * Why needed: Parses raw packaging ingredient strings into structured, hierarchical ingredient trees.
 */
export function parseIngredients(text: string | null | undefined): ParsedIngredient[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleaned = text.trim();
  if (cleaned.length === 0) {
    return [];
  }

  const topLevelSegments = splitAtDepthZero(cleaned);
  return topLevelSegments.map(seg => parseSingleFragment(seg));
}
