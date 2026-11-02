// Design tokens and color palette per PRD Section 6.

export const COLORS = {
  background: '#F4EFE4', // Warm paper
  surface: '#FFFFFF',    // Crisp card surface
  surfaceMuted: '#EFE9DC', // Subtle paper contrast
  ink: '#23201B',        // High contrast dark text
  inkSecondary: '#5E574E', // Medium contrast text (meets 4.5:1 on light)
  primary: '#9A5B13',    // Turmeric-brown primary action
  secondary: '#2F4A3A',  // Forest green secondary action
  border: '#CFC6B4',     // 1px border color
  borderDark: '#9E9480', // Active/focused border
  danger: '#9E2A2B',     // Error state
  allergenContains: '#8B1E1E', // Explicit red-brown text for CONTAINS
  allergenMayContain: '#9A5B13', // Turmeric text for MAY_CONTAIN
  allergenNotDeclared: '#2F4A3A', // Green text for NOT_DECLARED_IN_TEXT
};

export const FONTS = {
  regular: 'AtkinsonHyperlegible_400Regular',
  bold: 'AtkinsonHyperlegible_700Bold',
  italic: 'AtkinsonHyperlegible_400Regular_Italic',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 2,
  md: 4,
};

