// Product details screen with ingredients, allergens, and nutrition per PRD Section 2 F2 & Block 6.

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { fetchProduct, ProductResult, OPEN_FOOD_FACTS_ATTRIBUTION } from '../../src/services/productApi';
import { matchIngredient } from '../../src/domain/ingredientMatcher';
import { formatDisplayValue } from '../../src/domain/nutritionFormatter';
import { getDatabase } from '../../src/database/db';
import { Product } from '../../src/types';

export default function ProductScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ProductResult | null>(null);

  const reloadProduct = (code: string) => {
    setLoading(true);
    getDatabase()
      .then(db => fetchProduct(code, db))
      .then(res => {
        setResult(res);
        setLoading(false);
      })
      .catch(() => {
        setResult({
          success: false,
          error: {
            kind: 'SERVER_ERROR',
            message: 'An unexpected error occurred while loading product details.',
          },
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    if (!barcode) return;

    getDatabase()
      .then(db => fetchProduct(barcode, db))
      .then(res => {
        if (isMounted) {
          setResult(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResult({
            success: false,
            error: {
              kind: 'SERVER_ERROR',
              message: 'An unexpected error occurred while loading product details.',
            },
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [barcode]);

  if (loading) {
    return (
      <View style={styles.stateCenterContainer}>
        <Text style={styles.loadingText}>Looking up product...</Text>
      </View>
    );
  }

  if (!result || !result.success || !result.product) {
    const error = result?.error;
    const isNotFound = error?.kind === 'NOT_FOUND';

    return (
      <View style={styles.stateCenterContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            {isNotFound ? 'Product Not Found' : 'Lookup Notice'}
          </Text>
          <Text style={styles.errorBody}>
            {error?.message || 'Could not find information for this barcode.'}
          </Text>

          {isNotFound ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/paste')}
              accessibilityRole="button"
              accessibilityLabel="Paste ingredient text instead"
            >
              <Text style={styles.actionButtonText}>Paste Ingredients Instead</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => barcode && reloadProduct(barcode)}
              accessibilityRole="button"
              accessibilityLabel="Retry looking up product"
            >
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Return to home screen"
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const product: Product = result.product;
  const isOffline = result.source === 'cache';

  const containsAllergens = product.allergens.filter(a => a.state === 'CONTAINS');
  const mayContainAllergens = product.allergens.filter(a => a.state === 'MAY_CONTAIN');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Product Title Card */}
      <View style={styles.card}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productBrand}>{product.brand || 'Brand not specified'}</Text>
        <Text style={styles.barcodeText}>Barcode: {product.barcode}</Text>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>Opened from offline storage</Text>
          </View>
        )}
      </View>

      {/* Safety Notice Banner (Strict PRD Requirement) */}
      <View style={styles.safetyBanner}>
        <Text style={styles.safetyText}>
          Check the physical pack. Data can be incomplete or wrong.
        </Text>
      </View>

      {/* Allergens Card */}
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

      {/* Ingredients Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>
          Ingredients Breakdown ({product.parsedIngredients.length})
        </Text>

        {product.parsedIngredients.length > 0 ? (
          product.parsedIngredients.map((item, idx) => {
            const match = matchIngredient(item);
            const isMatched = match.status === 'Matched';

            return (
              <View key={`${item.name}-${idx}`} style={styles.ingredientRow}>
                <View style={styles.ingredientHeader}>
                  <Text style={styles.ingredientName}>
                    {item.name}
                    {item.percentage !== null ? ` (${item.percentage}%)` : ''}
                  </Text>
                  {isMatched && (
                    <TouchableOpacity
                      onPress={() => router.push(`/ingredient/${match.entry.id}`)}
                    >
                      <Text style={styles.detailLink}>View Factsheet</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isMatched ? (
                  <View style={styles.matchExplanation}>
                    <Text style={styles.categoryTag}>{match.entry.category}</Text>
                    <Text style={styles.purposeText}>{match.entry.purpose}</Text>
                    <Text style={styles.sourceText}>Source: {match.entry.sourceName}</Text>
                  </View>
                ) : (
                  <Text style={styles.unidentifiedText}>Not in our reference list.</Text>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.bodyText}>
            {product.ingredientsText || 'No ingredients declared in database.'}
          </Text>
        )}
      </View>

      {/* Nutrition Table per 100 g Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Nutrition per 100 g</Text>
        <Text style={styles.helperText}>
          {'Missing figures are marked "Not available" and never assumed to be zero.'}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Energy</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.energyKcal, 'kcal')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Total Fat</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.fat, 'g')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Saturated Fat</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.saturatedFat, 'g')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Carbohydrates</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.carbohydrates, 'g')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Total Sugars</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.sugars, 'g')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Added Sugars</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.addedSugars, 'g')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Protein</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.protein, 'g')}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Sodium</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.sodium, 'g')}
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowLast]}>
            <Text style={styles.tableCellLabel}>Salt</Text>
            <Text style={styles.tableCellValue}>
              {formatDisplayValue(product.nutrition.salt, 'g')}
            </Text>
          </View>
        </View>
      </View>

      {/* Attribution Footer */}
      <View style={styles.attributionBox}>
        <Text style={styles.attributionText}>{OPEN_FOOD_FACTS_ATTRIBUTION}</Text>
      </View>
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
  loadingText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 16,
    color: COLORS.primary,
  },
  errorCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    width: '100%',
    alignItems: 'center',
  },
  errorTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 18,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  errorBody: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: COLORS.ink,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    minHeight: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  actionButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.inkSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  productName: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 20,
    color: COLORS.ink,
  },
  productBrand: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 15,
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
  barcodeText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.inkSecondary,
    marginTop: 4,
  },
  offlineBadge: {
    backgroundColor: COLORS.surfaceMuted,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  offlineBadgeText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 12,
    color: COLORS.secondary,
  },
  safetyBanner: {
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  safetyText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: SPACING.sm,
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
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.allergenNotDeclared,
    fontStyle: 'italic',
  },
  ingredientRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  detailLink: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 12,
    color: COLORS.primary,
  },
  matchExplanation: {
    marginTop: 4,
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
    marginTop: 2,
    lineHeight: 18,
  },
  sourceText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 11,
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
  unidentifiedText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
  bodyText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.ink,
    lineHeight: 18,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCellLabel: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.ink,
  },
  tableCellValue: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.ink,
  },
  attributionBox: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  attributionText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 11,
    color: COLORS.inkSecondary,
    textAlign: 'center',
  },
});

