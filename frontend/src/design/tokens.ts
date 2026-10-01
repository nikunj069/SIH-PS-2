/**
 * Q-GREEN FLEET Design Tokens
 * Single source of truth for corporate, client-ready light B2B theme.
 * All color pairings strictly satisfy WCAG AA (>= 4.5:1 text, >= 3.0:1 UI graphics).
 */

export const tokens = {
  colors: {
    // Canvas & Surfaces
    bg: '#F6F8FB',
    surface: '#FFFFFF',
    border: '#D9E0EA',
    borderHover: '#B9C5D5',

    // Typography
    text: '#0F172A', // Slate 900 (Contrast ~14:1 on white)
    textMuted: '#475569', // Slate 600 (Contrast ~7:1 on white)
    textSubtle: '#64748B', // Slate 500 (Contrast ~4.6:1 on white)

    // Primary Interactive Blue
    primary: '#0B63CE',
    primaryHover: '#0A55B0',
    primaryPress: '#084792',
    primarySoft: '#E8F1FD',
    primaryFocusRing: 'rgba(11, 99, 206, 0.25)',

    // Semantic States
    success: '#0F7B5F',
    successSoft: '#E3F5EE',
    successText: '#065F46',

    warning: '#B45309',
    warningSoft: '#FEF3C7',
    warningText: '#92400E',

    danger: '#B42318',
    dangerSoft: '#FDECEA',
    dangerText: '#991B1B',

    info: '#0B4FA3',
    infoSoft: '#E8F1FD',
    infoText: '#0A3B7B',

    // Chart Series (Colorblind-Safe Palette)
    chart: [
      '#0B63CE', // Primary Blue
      '#0F7B5F', // Emerald Green
      '#D97706', // Amber Ochre
      '#7C3AED', // Violet
      '#0284C7', // Sky Blue
      '#E11D48', // Rose Red
      '#0D9488', // Teal
      '#475569', // Slate Slate
    ]
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'JetBrains Mono, "Fira Code", monospace',
    scale: {
      pageTitle: { fontSize: '28px', lineHeight: '36px', fontWeight: 600 },
      sectionTitle: { fontSize: '20px', lineHeight: '28px', fontWeight: 600 },
      cardTitle: { fontSize: '16px', lineHeight: '24px', fontWeight: 600 },
      body: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
      bodySmall: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
      label: { fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
      caption: { fontSize: '13px', lineHeight: '18px', fontWeight: 400 },
      kpiNumber: { fontSize: '36px', lineHeight: '40px', fontWeight: 600 },
      kpiSmall: { fontSize: '24px', lineHeight: '32px', fontWeight: 600 }
    }
  },

  radii: {
    control: '8px',
    card: '12px',
    pill: '9999px',
  },

  shadows: {
    card: '0 1px 2px rgba(15, 23, 42, 0.06)',
    cardHover: '0 4px 12px rgba(15, 23, 42, 0.08)',
    dropdown: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    drawer: '-4px 0 24px rgba(15, 23, 42, 0.12)',
  },

  spacing: {
    gutter: '32px',
    cardPadding: '24px',
    headerHeight: '64px',
    sidebarWidth: '256px',
    drawerWidth: '480px',
  }
} as const;

export type DesignTokens = typeof tokens;
