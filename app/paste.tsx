// Paste ingredients screen with local on-screen analysis per PRD Section 2 F3 & Block 6.

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { parseIngredients } from '../src/domain/ingredientParser';
import { detectAllergens } from '../src/domain/allergenDetector';
import { matchIngredient } from '../src/domain/ingredientMatcher';
import { AllergenInfo, ParsedIngredient } from '../src/types';

export default function PasteScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [parsedList, setParsedList] = useState<ParsedIngredient[]>([]);
  const [allergens, setAllergens] = useState<AllergenInfo[]>([]);

  const handleAnalyze = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setAnalyzed(false);
      return;
    }

    const parsed = parseIngredients(trimmed);
    const detected = detectAllergens(trimmed, parsed);

    setParsedList(parsed);
    setAllergens(detected);
    setAnalyzed(true);
  };

  const handleClear = () => {
    setInputText('');
    setAnalyzed(false);
    setParsedList([]);
    setAllergens([]);
  };

  const containsAllergens = allergens.filter(a => a.state === 'CONTAINS');
  const mayContainAllergens = allergens.filter(a => a.state === 'MAY_CONTAIN');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Paste Ingredients</Text>
      <Text style={styles.subtitle}>
        Copy and paste ingredient text from a product website or photo OCR
      </Text>

      {/* Input Box Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Ingredient Text</Text>
        <TextInput
          style={styles.textArea}
          value={inputText}
          onChangeText={setInputText}
          placeholder="e.g. Wheat flour (62%), Palm oil, Sugar, Emulsifiers (INS 471, INS 322), Salt. Contains: Wheat, Milk."
          placeholderTextColor={COLORS.inkSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          accessibilityLabel="Paste ingredient text"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.buttonFlex]}
            onPress={handleAnalyze}
            accessibilityRole="button"
            accessibilityLabel="Read and analyze pasted ingredients"
          >
            <Text style={styles.primaryButtonText}>Read Ingredients</Text>
          </TouchableOpacity>

          {inputText.length > 0 && (
            <TouchableOpacity
              style={[styles.secondaryButton, styles.clearBtnFlex]}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear ingredient text input"
            >
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Analysis Results (On-screen only, strictly not saved to SQLite) */}
      {analyzed && (
        <View>
          {/* Allergens Notice Card */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Declared Allergens</Text>
            {containsAllergens.length > 0 && (
              <View style={styles.allergenGroup}>
                <Text style={styles.allergenContainsLabel}>CONTAINS:</Text>
                <Text style={styles.allergenContainsText}>
                  {containsAllergens.map(a => a.allergen.toUpperCase()).join(', ')}
                </Text>
              </View>
            )}

            {mayContainAllergens.length > 0 && (
              <View style={styles.allergenGroup}>
                <Text style={styles.allergenMayContainLabel}>MAY CONTAIN (CROSS-CONTACT):</Text>
                <Text style={styles.allergenMayContainText}>
                  {mayContainAllergens.map(a => a.allergen.toUpperCase()).join(', ')}
                </Text>
              </View>
            )}

            {containsAllergens.length === 0 && mayContainAllergens.length === 0 && (
              <Text style={styles.noAllergenText}>
                No allergen declared in the text we read.
              </Text>
            )}
          </View>

          {/* Parsed Ingredients List */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>
              Parsed Ingredients ({parsedList.length})
            </Text>
            <Text style={styles.helperText}>
              Tap any matched additive to view purpose and authoritative source links.
            </Text>

            {parsedList.map((item, idx) => {
              const match = matchIngredient(item);
              const isMatched = match.status === 'Matched';

              return (
                <TouchableOpacity
                  key={`${item.name}-${idx}`}
                  style={styles.ingredientRow}
                  onPress={() => {
                    if (isMatched) {
                      router.push(`/ingredient/${match.entry.id}`);
                    }
                  }}
                  disabled={!isMatched}
                >
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientName}>
                      {item.name}
                      {item.percentage !== null ? ` (${item.percentage}%)` : ''}
                    </Text>
                    {isMatched && (
                      <Text style={styles.viewBadge}>Factsheet →</Text>
                    )}
                  </View>

                  {isMatched ? (
                    <View style={styles.matchExplanation}>
                      <Text style={styles.categoryTag}>{match.entry.category}</Text>
                      <Text style={styles.purposeText}>{match.entry.purpose}</Text>
                    </View>
                  ) : (
                    <Text style={styles.unidentifiedText}>Not in our reference list.</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  title: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 22,
    color: COLORS.ink,
  },
  subtitle: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: COLORS.inkSecondary,
    marginBottom: SPACING.md,
    lineHeight: 19,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardLabel: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  buttonFlex: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  clearBtnFlex: {
    width: 80,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.inkSecondary,
  },
  sectionHeader: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  helperText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginBottom: SPACING.sm,
  },
  allergenGroup: {
    marginBottom: SPACING.sm,
  },
  allergenContainsLabel: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.allergenContains,
  },
  allergenContainsText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.allergenContains,
    marginTop: 2,
  },
  allergenMayContainLabel: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.allergenMayContain,
  },
  allergenMayContainText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.allergenMayContain,
    marginTop: 2,
  },
  noAllergenText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 13,
    color: COLORS.allergenNotDeclared,
  },
  ingredientRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.ink,
    flex: 1,
    textTransform: 'capitalize',
  },
  viewBadge: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 12,
    color: COLORS.primary,
  },
  matchExplanation: {
    marginTop: 2,
  },
  categoryTag: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 11,
    color: COLORS.secondary,
  },
  purposeText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.ink,
    marginTop: 1,
  },
  unidentifiedText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
});
