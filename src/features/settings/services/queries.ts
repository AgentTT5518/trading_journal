import { db } from '@/lib/db';

import { log } from '../logger';
import type { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  traderName: '',
  timezone: 'America/New_York',
  currency: 'USD',
  startingCapital: null,
  defaultCommission: 0,
  defaultRiskPercent: 1,
  positionSizingMethod: 'fixed-dollar',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getSettings(): Promise<Settings> {
  try {
    const row = await db.query.settings.findFirst();
    return row ?? DEFAULT_SETTINGS;
  } catch (error) {
    log.error('Failed to fetch settings', error as Error);
    return DEFAULT_SETTINGS;
  }
}
