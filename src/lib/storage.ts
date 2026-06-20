import { DEFAULT_SETTINGS } from './finance';
import { statusForDateParts } from './transactions';
import type { BackupPayload, Entry, LedgerData, NormalizedBackup, Settings } from './types';

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

export function removeData(year: number) {
  localStorage.removeItem(PFX + year);
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
    const parsed = raw ? JSON.parse(raw) : {};
    const settings = normalizeSettings(parsed);
    if (raw && settings.balanceAnchorAt && !parsed.balanceAnchorAt) {
      localStorage.setItem(SET_KEY, JSON.stringify(settings));
    }
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SET_KEY, JSON.stringify(normalizeSettings(settings)));
}

export function normalizeSettings(settings: Partial<Settings> = {}, now = new Date()): Settings {
  const normalized = { ...DEFAULT_SETTINGS, ...settings };
  normalized.currentBalance = Number(normalized.currentBalance) || 0;

  if (normalized.currentBalance > 0 && !normalized.balanceAnchorAt) {
    return { ...normalized, balanceAnchorAt: now.toISOString() };
  }

  return normalized;
}

export function createBackupPayload(year: number, data: LedgerData, settings: Settings): BackupPayload {
  const years = collectDataYears(year, data);
  return {
    version: 2,
    year,
    data: years[String(year)] || normalizeLedgerData(data),
    years,
    settings,
    exportedAt: new Date().toISOString()
  };
}

export function collectDataYears(activeYear: number, activeData: LedgerData): Record<string, LedgerData> {
  const years = new Set([activeYear, ...listDataYears()]);
  return Object.fromEntries(
    [...years]
      .sort((a, b) => a - b)
      .map((itemYear) => [String(itemYear), normalizeLedgerData(itemYear === activeYear ? activeData : loadData(itemYear))])
  );
}

export function replaceDataYears(years: Record<string, LedgerData>) {
  listDataYears().forEach(removeData);
  Object.entries(years).forEach(([rawYear, yearData]) => {
    const itemYear = Number(rawYear);
    if (Number.isFinite(itemYear)) saveData(itemYear, normalizeLedgerData(yearData));
  });
}

export function normalizeBackup(payload: BackupPayload): NormalizedBackup {
  const years = normalizeBackupYears(payload);
  const year = payload.year ?? firstBackupYear(years);
  const data = year ? years[String(year)] || {} : {};
  return {
    year,
    data,
    years,
    settings: payload.settings ? normalizeSettings(payload.settings) : payload.settings
  };
}

function normalizeBackupYears(payload: BackupPayload) {
  if (payload.years && typeof payload.years === 'object') {
    return Object.fromEntries(
      Object.entries(payload.years)
        .filter(([rawYear]) => Number.isFinite(Number(rawYear)))
        .map(([rawYear, yearData]) => [String(Number(rawYear)), normalizeLedgerData(yearData || {})])
    );
  }

  if (payload.data) {
    const year = payload.year ?? firstLedgerYear(payload.data);
    return year ? { [String(year)]: normalizeLedgerData(payload.data) } : {};
  }

  return {};
}

function firstBackupYear(years: Record<string, LedgerData>) {
  const [first] = Object.keys(years)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return first;
}

function firstLedgerYear(data: LedgerData) {
  const [firstKey] = Object.keys(data);
  const year = Number(firstKey?.split('-')[0]);
  return Number.isFinite(year) ? year : undefined;
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
