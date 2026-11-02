// About, privacy, and DPDP "Delete all my data" screen per PRD Section 7 & F10.

import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { getDatabase } from '../src/database/db';
import { deleteAllData } from '../src/database/cleanup';
import { OPEN_FOOD_FACTS_ATTRIBUTION } from '../src/services/productApi';

export default function SettingsScreen() {
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all cached products and scan history from your device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const db = await getDatabase();
              await deleteAllData(db);
              setDeleted(true);
            } catch {
              Alert.alert('Error', 'Failed to delete data.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About & Privacy</Text>
      <Text style={styles.subtitle}>Privacy-first design and data management</Text>

      {/* Privacy Policy Summary Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>How Your Data is Handled</Text>
        <Text style={styles.bodyText}>
          1. <Text style={styles.boldText}>No Accounts</Text>: You do not need an email, phone number, or password to use Label Padho.
        </Text>
        <Text style={styles.bodyText}>
          2. <Text style={styles.boldText}>No Tracking</Text>: We use zero third-party analytics SDKs, advertising libraries, or background location trackers.
        </Text>
        <Text style={styles.bodyText}>
          3. <Text style={styles.boldText}>Barcode Queries</Text>: Barcode numbers are sent directly to the non-profit Open Food Facts database to retrieve ingredients.
        </Text>
        <Text style={styles.bodyText}>
          4. <Text style={styles.boldText}>Device Storage</Text>: Your scan history and cached products are stored locally in an SQLite database on your device.
        </Text>
        <Text style={styles.bodyText}>
          5. <Text style={styles.boldText}>Pasted Text</Text>: Pasted ingredients are analysed on screen only and are never saved to SQLite or sent over the network.
        </Text>
      </View>

      {/* DPDP Delete All Data Control */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Data Erasure (DPDP Act)</Text>
        <Text style={styles.bodyText}>
          {"Under India's Digital Personal Data Protection Act, you have the right to erase all your local data at any time."}
        </Text>

        {deleted ? (
          <View style={styles.deletedBox}>
            <Text style={styles.deletedText}>
              All scan history and cached products have been erased from this device.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAll}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete all cached products and scan history"
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting Data...' : 'Delete All My Data'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Project & Creator Info */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Project Details</Text>
        <Text style={styles.bodyText}>
          Label Padho is an independent student project created by Angel Kandoi in Jaipur, India. It is not a registered business.
        </Text>
        <Text style={[styles.bodyText, styles.spaced]}>
          Grievance & Contact Email: angelaggarwal2409@gmail.com
        </Text>
        <Text style={[styles.bodyText, styles.spaced]}>
          License & Sources: {OPEN_FOOD_FACTS_ATTRIBUTION}. Font files are Atkinson Hyperlegible licensed under OFL.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.backButtonText}>← Back to Home</Text>
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
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: SPACING.sm,
  },
  bodyText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 13,
    color: COLORS.ink,
    lineHeight: 19,
    marginBottom: 6,
  },
  boldText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    color: COLORS.ink,
  },
  spaced: {
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: COLORS.danger,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  deleteButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.danger,
  },
  deletedBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  deletedText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 13,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
});

