export const theme = {
  colors: {
    // Primary Brand
    primary: '#16A34A', // Green 600
    primaryDark: '#15803D', // Green 700
    primaryLight: '#DCFCE7', // Green 100
    
    // Accents
    accent: '#ECC323', // Yellow accent
    accentDark: '#D4AF37',
    
    // Backgrounds
    background: '#F8FAF9',
    surface: '#FFFFFF',
    border: '#E5E7EB', // Gray 200
    divider: '#F3F4F6', // Gray 100

    // Text
    textPrimary: '#1F2937', // Gray 800
    textSecondary: '#6B7280', // Gray 500
    textMuted: '#9CA3AF', // Gray 400
    textInverse: '#FFFFFF',

    // Status
    success: '#10B981',
    successBg: '#ECFDF5',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
    urgent: '#EF4444',
  },

  // 8pt Grid System
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  typography: {
    fontFamily: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semiBold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
    size: {
      xs: 12,
      sm: 14,
      md: 15, // standard body size used across the app
      lg: 18,
      xl: 22,
      xxl: 28,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 22,
      lg: 26,
      xl: 28,
      xxl: 34,
    },
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20, // used heavily in cards
    full: 9999,
  },

  shadows: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    strong: {
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

/**
 * Resident-only semantic palette.
 *
 * Keep this separate from the global theme so the volunteer and authentication
 * experiences can retain their existing brand treatment. Resident screens use
 * dark ink for content, brand green for icons, and a soft green accent border
 * around white interactive surfaces.
 */
export const residentTheme = {
  colors: {
    ink: '#111827',
    inkSoft: '#1F2937',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    background: '#F7F7F5',
    surface: '#FFFFFF',
    surfaceMuted: '#FFFFFF',
    border: '#A7D7B8',
    divider: '#ECEDEF',
    brand: '#16834B',
    brandSoft: '#EAF6EF',
    icon: '#16834B',
    iconSurface: '#FFFFFF',
    borderAccent: '#A7D7B8',
    inverse: '#FFFFFF',
    overlay: 'rgba(17, 24, 39, 0.56)',
  },
  shadow: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;
