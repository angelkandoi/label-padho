// Scan history screen showing local SQLite records per PRD Section 2 F9 & Block 6.

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { getDatabase } from '../src/database/db';
import { getScanHistory, HistoryItem } from '../src/database/historyRepository';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getDatabase()
      .then(db => getScanHistory(db, 100))
      .then(items => {
        if (isMounted) {
          setHistory(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHistory([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan History</Text>
      <Text style={styles.subtitle}>Products saved offline on your device</Text>

      {loading ? (
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : history.length > 0 ? (
        <View style={styles.card}>
          {history.map(item => (
            <TouchableOpacity
              key={`${item.id}-${item.barcode}`}
              style={styles.row}
              onPress={() => router.push(`/product/${item.barcode}`)}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${item.name}`}
            >
              <View style={styles.textCol}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>
                  {item.brand ? `${item.brand} • ` : ''}
                  {item.barcode}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(item.scannedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Scans Recorded</Text>
          <Text style={styles.emptyBody}>
            When you scan barcodes on food packets, they will be saved here so you can open them anytime offline.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/scanner')}
            accessibilityRole="button"
            accessibilityLabel="Scan your first barcode"
          >
            <Text style={styles.actionButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
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
  },
  centerBox: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular_Italic',
    fontSize: 14,
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 48,
  },
  textCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  productName: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: COLORS.ink,
  },
  productMeta: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
  dateText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: SPACING.xs,
  },
  emptyBody: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.inkSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    minHeight: 48,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  actionButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

