// Home screen with scan, paste, dictionary search, and history per PRD Section 6 & Block 6.

import React, { useState, useEffect } from 'react';
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
import { getAllDictionaryEntries } from '../src/domain/ingredientMatcher';
import { getDatabase } from '../src/database/db';
import { getScanHistory, HistoryItem } from '../src/database/historyRepository';
import { DictionaryEntry } from '../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DictionaryEntry[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const dictionary = getAllDictionaryEntries();

  useEffect(() => {
    let isMounted = true;
    getDatabase()
      .then(db => getScanHistory(db, 5))
      .then(items => {
        if (isMounted) {
          setHistoryItems(items);
          setHistoryLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHistoryItems([]);
          setHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const cleanCode = trimmed.replace(/^(?:ins|e)\s*/i, '');

    const filtered = dictionary.filter(entry => {
      const nameMatch = entry.names.some(n => n.toLowerCase().includes(trimmed));
      const insMatch = entry.insCode ? entry.insCode.toLowerCase().includes(cleanCode) : false;
      return nameMatch || insMatch;
    });

    setSearchResults(filtered.slice(0, 5));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Label Padho</Text>
        <Text style={styles.tagline}>Read what is on your packet.</Text>
      </View>

      {/* Primary Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.primaryButton, styles.buttonFlex]}
          onPress={() => router.push('/scanner')}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode with camera"
        >
          <Text style={styles.primaryButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, styles.buttonFlex]}
          onPress={() => router.push('/paste')}
          accessibilityRole="button"
          accessibilityLabel="Paste ingredient text"
        >
          <Text style={styles.secondaryButtonText}>Paste Ingredients</Text>
        </TouchableOpacity>
      </View>

      {/* Dictionary Search Box */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Additive & Ingredient Search</Text>
        <Text style={styles.helperText}>
          Search any additive code (e.g. INS 211, 500(ii)) or ingredient (e.g. maltodextrin).
        </Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Type name or INS code..."
          placeholderTextColor={COLORS.inkSecondary}
          accessibilityLabel="Search ingredient dictionary"
        />

        {searchQuery.trim().length > 0 && (
          <View style={styles.searchOutput}>
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => router.push(`/ingredient/${item.id}`)}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultName}>{item.names[0]}</Text>
                    {item.insCode && <Text style={styles.insBadge}>INS {item.insCode}</Text>}
                  </View>
                  <Text style={styles.resultPurpose} numberOfLines={2}>
                    {item.purpose}
                  </Text>
                  <Text style={styles.sourceText}>Source: {item.sourceName}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noMatchText}>Not in our reference list.</Text>
            )}
          </View>
        )}
      </View>

      {/* Recent Scans Section */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {historyItems.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.linkText}>View all</Text>
            </TouchableOpacity>
          )}
        </View>

        {historyLoading ? (
          <Text style={styles.loadingStateText}>Loading recent scans...</Text>
        ) : historyItems.length > 0 ? (
          historyItems.map(item => (
            <TouchableOpacity
              key={`${item.id}-${item.barcode}`}
              style={styles.historyRow}
              onPress={() => router.push(`/product/${item.barcode}`)}
            >
              <View style={styles.historyTextCol}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyBrand}>
                  {item.brand ? `${item.brand} • ` : ''}
                  {item.barcode}
                </Text>
              </View>
              <Text style={styles.historyTime}>
                {new Date(item.scannedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateTitle}>No scanned products yet</Text>
            <Text style={styles.emptyStateBody}>
              Scan a barcode on food packaging or paste ingredient text to inspect additives and declared allergens.
            </Text>
          </View>
        )}
      </View>

      {/* Footer Navigation */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/history')}>
          <Text style={styles.footerText}>All History</Text>
        </TouchableOpacity>
        <Text style={styles.footerDivider}>•</Text>
        <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/settings')}>
          <Text style={styles.footerText}>About & Privacy</Text>
        </TouchableOpacity>
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
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  appTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 26,
    color: COLORS.ink,
  },
  tagline: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 15,
    color: COLORS.inkSecondary,
    marginTop: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  buttonFlex: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
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
    borderColor: COLORS.secondary,
  },
  secondaryButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: COLORS.secondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  helperText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.inkSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: '#FFFFFF',
  },
  searchOutput: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  searchResultItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.ink,
    textTransform: 'capitalize',
  },
  insBadge: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  resultPurpose: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
  sourceText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 2,
  },
  noMatchText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 13,
    color: COLORS.inkSecondary,
    paddingVertical: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 48,
  },
  historyTextCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  historyName: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.ink,
  },
  historyBrand: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  historyTime: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 11,
    color: COLORS.inkSecondary,
  },
  linkText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.primary,
  },
  loadingStateText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.inkSecondary,
    fontStyle: 'italic',
    paddingVertical: SPACING.sm,
  },
  emptyStateBox: {
    paddingVertical: SPACING.md,
  },
  emptyStateTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  emptyStateBody: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.inkSecondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  footerLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  footerText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.inkSecondary,
  },
  footerDivider: {
    color: COLORS.border,
  },
});
