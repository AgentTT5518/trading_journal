export const APP_CONFIG = {
  appName: 'Trading Journal',
  dbPath: './data/trading-journal.db',
  screenshotDir: './data/screenshots',
  maxScreenshotSizeMb: 5,
  allowedImageTypes: ['image/png', 'image/jpeg', 'image/webp'],
  // All dates are stored as UTC ISO 8601 strings.
  // Client-side formatting converts to the user's local timezone.
  dateFormat: 'UTC_ISO8601',
} as const;
