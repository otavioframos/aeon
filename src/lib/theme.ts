export const DEFAULT_ACCENT = '#247E5C';

export const ACCENT_SWATCHES = ['#247E5C', '#2F7E75', '#6D7E24', '#7E5C24', '#6B6FA0', '#8B5F6B'];

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function normalizeHex(value: string, fallback = DEFAULT_ACCENT) {
  const raw = value.trim().replace(/^#/, '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((part) => part + part)
          .join('')
      : raw;
  return /^[0-9a-fA-F]{6}$/.test(expanded) ? `#${expanded.toUpperCase()}` : fallback;
}

export function hexToRgb(value: string): RgbColor {
  const hex = normalizeHex(value).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mix(a: RgbColor, b: RgbColor, amount: number): RgbColor {
  return {
    r: clamp(a.r + (b.r - a.r) * amount),
    g: clamp(a.g + (b.g - a.g) * amount),
    b: clamp(a.b + (b.b - a.b) * amount)
  };
}

export function rgbString(color: RgbColor) {
  return `${color.r}, ${color.g}, ${color.b}`;
}

export function themeVars(accentHex: string) {
  const accent = hexToRgb(accentHex);
  const cta = mix(accent, { r: 217, g: 217, b: 217 }, 0.58);
  const text = mix(accent, { r: 217, g: 217, b: 217 }, 0.46);
  const muted = mix(accent, { r: 115, g: 115, b: 115 }, 0.54);
  return {
    '--accent-rgb': rgbString(accent),
    '--cta-rgb': rgbString(cta),
    '--text-strong-rgb': rgbString(text),
    '--color-green': normalizeHex(accentHex),
    '--color-cta': `rgb(${rgbString(cta)})`,
    '--color-text-strong': `rgb(${rgbString(text)})`,
    '--color-text': `rgb(${rgbString(muted)})`
  };
}

export function themeStyle(accentHex: string) {
  return Object.entries(themeVars(accentHex))
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}
