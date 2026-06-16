import { DialStore, type ControlMeta, type ShortcutConfig } from 'dialkit/store';

export const DRAG_SENSITIVITY = 8;

export function decimalsForStep(step = 1) {
  if (!Number.isFinite(step)) return 0;
  const stepText = String(step);
  if (stepText.includes('e-')) return Number(stepText.split('e-')[1] ?? 0);
  return stepText.includes('.') ? stepText.split('.')[1].length : 0;
}

export function roundValue(value: number, step = 1) {
  const decimals = decimalsForStep(step);
  return Number(value.toFixed(decimals));
}

export function snapToDecile(value: number, min: number, max: number) {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) return value;
  const decile = range / 10;
  return min + Math.round((value - min) / decile) * decile;
}

export function formatSliderShortcut(shortcut: ShortcutConfig) {
  return formatShortcut(shortcut);
}

export function formatToggleShortcut(shortcut: ShortcutConfig) {
  return formatShortcut(shortcut);
}

export function getEffectiveStep(control: ControlMeta, shortcut?: ShortcutConfig) {
  const base = control.step ?? 1;
  if (shortcut?.mode === 'fine') return base / 10;
  if (shortcut?.mode === 'coarse') return base * 10;
  return base;
}

export function applySliderDelta(panelId: string, path: string, control: ControlMeta, step: number, direction: number) {
  const current = Number(DialStore.getValue(panelId, path) ?? 0);
  const min = control.min ?? Number.NEGATIVE_INFINITY;
  const max = control.max ?? Number.POSITIVE_INFINITY;
  const next = Math.max(min, Math.min(max, roundValue(current + step * direction, control.step ?? step)));
  DialStore.updateValue(panelId, path, next);
}

export function findControl(controls: ControlMeta[], path: string): ControlMeta | null {
  for (const control of controls) {
    if (control.path === path) return control;
    if (control.children) {
      const child = findControl(control.children, path);
      if (child) return child;
    }
  }

  return null;
}

export function isInputFocused() {
  const active = document.activeElement;
  if (!active) return false;
  const tagName = active.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || active.getAttribute('contenteditable') === 'true';
}

export function getActiveModifier(event: KeyboardEvent | WheelEvent | MouseEvent) {
  if (event.altKey) return 'alt';
  if (event.shiftKey) return 'shift';
  if (event.metaKey) return 'meta';
  return undefined;
}

function formatShortcut(shortcut: ShortcutConfig) {
  const pieces = [];
  if (shortcut.modifier) pieces.push(shortcut.modifier);
  if (shortcut.key) pieces.push(shortcut.key);
  return pieces.join('+').toUpperCase();
}
