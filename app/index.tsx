// Minimal Block 5 interactive test screen for phone verification per PRD Section 9 Block 5.

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { fetchProduct, ProductResult, OPEN_FOOD_FACTS_ATTRIBUTION } from '../src/services/productApi';
import { BarcodeDebouncer, validateBarcode } from '../src/services/barcodeService';
import { getDatabase } from '../src/database/db';

const debouncer = new BarcodeDebouncer(3000);

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleLookup = async (code: string) => {
    const validation = validateBarcode(code);
    if (!validation.valid) {
      setResult({
        success: false,
        error: { kind: 'NOT_FOUND', message: validation.error || 'Invalid barcode' },
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const db = await getDatabase();
      const res = await fetchProduct(code, db);
      setResult(res);
    } catch {
      setResult({
        success: false,
        error: { kind: 'SERVER_ERROR', message: 'Unexpected lookup failure' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (debouncer.shouldAcceptScan(data)) {
      setCameraActive(false);
      setBarcodeInput(data);
      handleLookup(data);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Label Padho</Text>
      <Text style={styles.subtitle}>Block 5 Scanner Verification</Text>

      {cameraActive ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <TouchableOpacity style={styles.closeCamBtn} onPress={() => setCameraActive(false)}>
            <Text style={styles.btnText}>Close Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              if (!permission?.granted) {
                const res = await requestPermission();
                if (!res.granted) return;
              }
              setCameraActive(true);
            }}
          >
            <Text style={styles.btnText}>Open Camera Scanner</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Or enter barcode manually:</Text>
          <TextInput
            style={styles.input}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="e.g. 4006381333931 or 8901030925542"
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLookup(barcodeInput)}>
            <Text style={styles.btnText}>Lookup Barcode</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <Text style={styles.loadingText}>Looking up product...</Text>}

      {result && (
        <View style={styles.resultBox}>
          {result.success && result.product ? (
            <View>
              <Text style={styles.prodName}>{result.product.name}</Text>
              <Text style={styles.prodBrand}>{result.product.brand || 'No brand specified'}</Text>
              <Text style={styles.sourceTag}>Source: {result.source === 'cache' ? 'Offline Cache (SQLite)' : 'Open Food Facts'}</Text>
              <Text style={styles.sectionHeader}>Ingredients ({result.product.parsedIngredients.length}):</Text>
              <Text style={styles.bodyText}>{result.product.ingredientsText || 'No ingredient text'}</Text>
              <Text style={styles.sectionHeader}>Allergens:</Text>
              {result.product.allergens
                .filter(a => a.state !== 'NOT_DECLARED_IN_TEXT')
                .map(a => (
                  <Text key={a.allergen} style={styles.allergenItem}>
                    • {a.allergen.toUpperCase()}: {a.state}
                  </Text>
                ))}
              <Text style={styles.attribution}>{OPEN_FOOD_FACTS_ATTRIBUTION}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.errorHeader}>Lookup Result: {result.error?.kind}</Text>
              <Text style={styles.bodyText}>{result.error?.message}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F4EFE4',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23201B',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#9A5B13',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFC6B4',
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#23201B',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CFC6B4',
    padding: 10,
    borderRadius: 2,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  actionBtn: {
    backgroundColor: '#9A5B13',
    padding: 14,
    borderRadius: 2,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraBox: {
    height: 350,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  closeCamBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#23201B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 2,
  },
  loadingText: {
    color: '#9A5B13',
    fontStyle: 'italic',
    marginVertical: 12,
  },
  resultBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFC6B4',
    padding: 16,
    borderRadius: 4,
    marginTop: 10,
  },
  prodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23201B',
  },
  prodBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  sourceTag: {
    fontSize: 12,
    color: '#2F4A3A',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#23201B',
    marginTop: 10,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    color: '#23201B',
    lineHeight: 18,
  },
  allergenItem: {
    fontSize: 13,
    color: '#9A5B13',
    marginVertical: 2,
  },
  errorHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#C0392B',
    marginBottom: 6,
  },
  attribution: {
    fontSize: 11,
    color: '#777',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
