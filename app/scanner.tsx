// Barcode camera scanner screen with manual fallback per PRD Section 2 F1 & Block 6.

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { BarcodeDebouncer, validateBarcode } from '../src/services/barcodeService';

const debouncer = new BarcodeDebouncer(3000);

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (debouncer.shouldAcceptScan(data)) {
      const validation = validateBarcode(data);
      if (validation.valid) {
        router.push(`/product/${encodeURIComponent(data.trim())}`);
      } else {
        setErrorMessage(validation.error || 'Invalid barcode.');
      }
    }
  };

  const handleManualSubmit = () => {
    setErrorMessage('');
    const validation = validateBarcode(manualCode);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid barcode.');
      return;
    }
    router.push(`/product/${encodeURIComponent(manualCode.trim())}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan Barcode</Text>
      <Text style={styles.subtitle}>Align food package barcode within the frame</Text>

      {/* Camera View or Permission Prompt */}
      <View style={styles.cameraContainer}>
        {!permission ? (
          <View style={styles.centeredMessage}>
            <Text style={styles.messageText}>Requesting camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centeredMessage}>
            <Text style={styles.deniedTitle}>Camera Permission Required</Text>
            <Text style={styles.messageText}>
              We need camera access to scan barcodes on food packets. You can also enter the barcode manually below.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
              accessibilityRole="button"
              accessibilityLabel="Grant camera permission"
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}
      </View>

      {/* Error Message */}
      {errorMessage.length > 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Manual Entry Fallback */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manual Barcode Entry</Text>
        <Text style={styles.helperText}>
          If your camera cannot focus on a shiny or curved label, enter the barcode number printed below the lines.
        </Text>
        <TextInput
          style={styles.input}
          value={manualCode}
          onChangeText={text => {
            setManualCode(text);
            if (errorMessage) setErrorMessage('');
          }}
          placeholder="e.g. 8901030925542"
          placeholderTextColor={COLORS.inkSecondary}
          keyboardType="numeric"
          accessibilityLabel="Enter barcode number manually"
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleManualSubmit}
          accessibilityRole="button"
          accessibilityLabel="Lookup manually entered barcode"
        >
          <Text style={styles.submitButtonText}>Read Packet</Text>
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
  cameraContainer: {
    height: 300,
    backgroundColor: '#000000',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  centeredMessage: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  deniedTitle: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  messageText: {
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    minHeight: 48,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  permissionButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    color: COLORS.danger,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  cardTitle: {
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
    marginBottom: SPACING.md,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  submitButtonText: {
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});

