/**
 * Design System - Standard patterns, spacing, and typography
 * This file serves as the single source of truth for all design decisions
 */

export const typography = {
  // Page titles
  pageTitle: 'text-4xl font-bold font-serif',
  pageSubtitle: 'text-base text-muted-foreground mt-2',

  // Section headings
  sectionTitle: 'text-2xl font-semibold font-serif',
  subsectionTitle: 'text-lg font-semibold',
  smallTitle: 'text-sm font-semibold text-muted-foreground uppercase tracking-wide',

  // Body text
  body: 'text-sm text-foreground',
  bodyMuted: 'text-sm text-muted-foreground',
  bodySmall: 'text-xs text-muted-foreground',

  // Labels and helpers
  label: 'text-xs font-semibold uppercase tracking-wide',
};

export const spacing = {
  // Page/container padding
  pagePaddingY: 'py-8',
  pagePaddingX: 'px-6',
  pagePadding: 'px-6 py-8',

  // Responsive padding (desktop-first approach)
  pagePaddingResponsive: 'px-6 py-8 sm:px-4 sm:py-6',
  cardPaddingResponsive: 'p-6 sm:p-4',

  // Section spacing
  sectionGap: 'space-y-8',
  sectionGapSmall: 'space-y-6',
  sectionGapTiny: 'space-y-4',

  // Card/item padding
  cardPadding: 'p-6',
  cardPaddingCompact: 'p-4',

  // Gaps
  gapDefault: 'gap-4',
  gapSmall: 'gap-3',
  gapTiny: 'gap-2',

  // Margins
  marginTopSection: 'mt-8',
  marginBottomSection: 'mb-8',
};

export const containers = {
  // Standard page container
  pageContainer: 'min-h-screen bg-background',
  pageInner: 'max-w-5xl mx-auto px-6 py-8',

  // Wider layouts (dashboards with more content)
  wideContainer: 'max-w-6xl mx-auto px-6 py-8',

  // Narrower layouts (forms, focused content)
  narrowContainer: 'max-w-3xl mx-auto px-6 py-8',

  // Responsive containers (desktop-first approach)
  pageInnerResponsive: 'max-w-5xl mx-auto px-6 py-8 sm:px-4 sm:py-6',
  wideContainerResponsive: 'max-w-6xl mx-auto px-6 py-8 sm:px-4 sm:py-6',
  narrowContainerResponsive: 'max-w-3xl mx-auto px-6 py-8 sm:px-4 sm:py-6',

  // Grid layouts
  gridDefault: 'grid grid-cols-1 gap-4',
  gridTwoCol: 'grid grid-cols-2 gap-4',
  gridThreeCol: 'grid grid-cols-3 gap-4',
};

export const components = {
  // Cards and containers
  card: 'border rounded-lg bg-card p-6',
  cardCompact: 'border rounded-lg bg-card p-4',
  cardHoverable: 'border rounded-lg bg-card p-4 hover:border-foreground/20 cursor-pointer transition-colors',

  // Empty states
  emptyStateContainer: 'flex flex-col items-center justify-center py-12 px-6',
  emptyStateBox: 'rounded-lg border-2 border-dashed p-12 max-w-md text-center',
  emptyStateIcon: 'w-10 h-10 text-muted-foreground/50 mx-auto mb-4',
  emptyStateTitle: 'text-lg font-semibold mb-2',
  emptyStateDescription: 'text-sm text-muted-foreground',

  // Loading states
  loadingContainer: 'flex items-center justify-center py-12',
  loadingSpinner: 'w-6 h-6 animate-spin text-muted-foreground',

  // Status badges - consolidated with consistent styling
  badge: 'px-2 py-1 rounded text-xs font-semibold',
  badgeDefault: 'px-2 py-1 rounded text-xs font-semibold bg-secondary text-muted-foreground',
  badgeSuccess: 'px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700',
  badgeWarning: 'px-2 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700',
  badgeError: 'px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-700',
  badgeNeutral: 'px-2 py-1 rounded text-xs font-semibold bg-secondary text-muted-foreground',

  // List items
  listItem: 'p-4 hover:bg-secondary/50 cursor-pointer transition-colors',
  listItemCompact: 'p-3 hover:bg-secondary/50 transition-colors',

  // Section divider
  sectionDivider: 'flex items-center gap-4 mb-5 pb-4 border-b',

  // Responsive components
  modalContent: 'w-[calc(100%-2rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-auto',
  sidePanelResponsive: 'w-full md:w-96 md:border-l border-t md:border-t-0 flex flex-col bg-background',
};

export const pageHeader = {
  // Use for all page headers
  container: 'mb-8',
  title: 'text-4xl font-bold font-serif mb-2',
  subtitle: 'text-base text-muted-foreground',
};

export const sectionHeader = {
  // Use for section headers within pages
  container: 'mb-6',
  title: 'text-2xl font-semibold font-serif mb-1',
  subtitle: 'text-sm text-muted-foreground',
};

export const listContainer = {
  // Lists and grids of items
  container: 'border rounded-lg divide-y bg-card overflow-hidden',
  item: 'p-4 hover:bg-secondary/50 cursor-pointer transition-colors',
  itemCompact: 'p-3 hover:bg-secondary/50 transition-colors',
};

export const modal = {
  // Modal content spacing
  content: 'space-y-6',
  section: 'space-y-4',
};

export const inputs = {
  // Standard input styling
  searchInput: 'w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20',
  textInput: 'w-full px-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20',
};
