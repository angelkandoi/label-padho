// Ingredient factsheet screen displaying verified additive information per PRD Section 3 & Block 6.

import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { getAllDictionaryEntries } from '../../src/domain/ingredientMatcher';

export default function IngredientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const dictionary = getAllDictionaryEntries();
  const entry = dictionary.find(item => item.id === id);

  if (!entry) {
    return (
      <View style={styles.stateCenterContainer}>
        <View style={styles.card}>
          <Text style={styles.errorTitle}>Not in Reference List</Text>
          <Text style={styles.errorBody}>
            This item is not present in our curated dictionary of verified additives and ingredients.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleOpenSource = () => {
    if (entry.sourceUrl) {
      Linking.openURL(entry.sourceUrl).catch(() => {});
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Title Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{entry.names[0]}</Text>
          {entry.insCode && <Text style={styles.insBadge}>INS {entry.insCode}</Text>}
        </View>
        <Text style={styles.category}>{entry.category}</Text>
      </View>

      {/* Function and Purpose Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Purpose in Food</Text>
        <Text style={styles.bodyText}>{entry.purpose}</Text>

        <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>What It Is</Text>
        <Text style={styles.bodyText}>{entry.description}</Text>
      </View>

      {/* Aliases Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Known Names and Label Aliases</Text>
        <View style={styles.aliasContainer}>
          {entry.names.map((alias, idx) => (
            <View key={idx} style={styles.aliasPill}>
              <Text style={styles.aliasText}>{alias}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Source Verification Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Verification & Source</Text>
        <Text style={styles.bodyText}>
          Standard regulatory reference from {entry.sourceName}. Last verified on {entry.lastVerified}.
        </Text>
        {entry.sourceUrl && (
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={handleOpenSource}
            accessibilityRole="link"
            accessibilityLabel={`Open reference source from ${entry.sourceName}`}
          >
            <Text style={styles.sourceButtonText}>Open Source ({entry.sourceName}) ↗</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  stateCenterContainer: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 22,
    color: COLORS.ink,
    textTransform: 'capitalize',
    flex: 1,
  },
  insBadge: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  category: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  sectionHeader: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  sectionHeaderSpaced: {
    marginTop: SPACING.md,
  },
  bodyText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
  },
  aliasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  aliasPill: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  aliasText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 12,
    color: COLORS.ink,
  },
  sourceButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  sourceButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.secondary,
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: COLORS.primary,
  },
  errorTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: COLORS.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
  },
  buttonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

