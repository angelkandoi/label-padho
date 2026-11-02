// Root navigation layout loading Atkinson font per PRD Section 4 & 6.

import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import {
  useFonts,
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
  AtkinsonHyperlegible_400Regular_Italic,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    AtkinsonHyperlegible_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Label Padho...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.ink,
        headerTitleStyle: {
          fontFamily: 'AtkinsonHyperlegible_700Bold',
          fontSize: 18,
          color: COLORS.ink,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Label Padho' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scan Barcode' }} />
      <Stack.Screen name="product/[barcode]" options={{ title: 'Product Details' }} />
      <Stack.Screen name="paste" options={{ title: 'Paste Ingredients' }} />
      <Stack.Screen name="history" options={{ title: 'Scan History' }} />
      <Stack.Screen name="settings" options={{ title: 'About & Privacy' }} />
      <Stack.Screen name="ingredient/[id]" options={{ title: 'Ingredient Factsheet' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 16,
  },
});
