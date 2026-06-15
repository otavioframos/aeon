import { DEFAULT_SETTINGS } from './finance';
import type { BackupPayload, LedgerData, Settings } from './types';

const PFX = 'fluxo_v3_';
const SET_KEY = 'fluxo_settings_v3';

export function loadData(year: number): LedgerData {
  try {
    const raw = localStorage.getItem(PFX + year);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveData(year: number, data: LedgerData) {
  localStorage.setItem(PFX + year, JSON.stringify(data));
}

export function listDataYears() {
  const years = new Set<number>();
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const storageKey = localStorage.key(index);
      if (!storageKey?.startsWith(PFX)) continue;
      const year = Number(storageKey.slice(PFX.length));
      if (Number.isFinite(year)) years.add(year);
    }
  } catch {
    return [];
  }
  return [...years].sort((a, b) => a - b);
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SET_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SET_KEY, JSON.stringify(settings));
}

export function normalizeBackup(payload: BackupPayload) {
  return {
    year: payload.year,
    data: payload.data || {},
    settings: payload.settings
  };
}
