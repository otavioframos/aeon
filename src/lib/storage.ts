import { DEFAULT_SETTINGS } from './finance';
import { statusForDateParts } from './transactions';
import type { BackupPayload, Entry, LedgerData, Settings } from './types';

const PFX = 'fluxo_v3_';
const SET_KEY = 'fluxo_settings_v3';

export function loadData(year: number): LedgerData {
  try {
    const raw = localStorage.getItem(PFX + year);
    return raw ? normalizeLedgerData(JSON.parse(raw)) : {};
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
    data: normalizeLedgerData(payload.data || {}),
    settings: payload.settings
  };
}

function normalizeLedgerData(source: LedgerData): LedgerData {
  return Object.fromEntries(
    Object.entries(source).map(([entryKey, entries]) => {
      const [year, month, day] = entryKey.split('-').map(Number);
      const normalizedEntries = entries.map((entry) => normalizeEntry(entry, year, month, day));
      return [entryKey, normalizedEntries];
    })
  );
}

function normalizeEntry(entry: Entry, year: number, month: number, day: number): Entry {
  const desc = entry.desc || '';
  const hadForecastMarker = /\s*\[previsto\]\s*/i.test(desc);
  return {
    ...entry,
    desc: desc.replace(/\s*\[previsto\]\s*/gi, ' ').replace(/\s+/g, ' ').trim(),
    status: entry.status || (hadForecastMarker ? 'forecast' : statusForDateParts(year, month, day))
  };
}
