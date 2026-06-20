import type { Category } from './types';

export const CATS: Category[] = [
  {
    id: 'mercado',
    name: 'Market',
    icon: '<path d="M3 3h2l2 13h11l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>',
    group: 'Essenciais'
  },
  {
    id: 'graduacao',
    name: 'Education',
    icon: '<path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10v5c0 1 3 2 6 2s6-1 6-2v-5"/>',
    group: 'Investimentos'
  },
  {
    id: 'pets',
    name: 'Pets',
    icon: '<circle cx="6.5" cy="10" r="1.6"/><circle cx="10.5" cy="6.5" r="1.6"/><circle cx="14.5" cy="6.5" r="1.6"/><circle cx="18" cy="10" r="1.6"/><path d="M8 16c0-2.5 2-4 4-4s4 1.5 4 4-2 3-4 3-4-.5-4-3z"/>',
    group: 'Essenciais'
  },
  {
    id: 'lazer',
    name: 'Desires',
    icon: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/>',
    group: 'Desejos'
  },
  {
    id: 'reserva',
    name: 'Reserve',
    icon: '<path d="M3 7h18v12H3z"/><path d="M3 7l9-4 9 4"/><circle cx="12" cy="13" r="2"/>',
    group: 'Reserva'
  },
  {
    id: 'invest',
    name: 'Invest',
    icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
    group: 'Investimentos'
  },
  {
    id: 'imposto',
    name: 'Tax',
    icon: '<path d="M9 7h6M9 11h6M9 15h4"/><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/>',
    group: 'Empresa'
  },
  {
    id: 'renda',
    name: 'Income',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4"/>',
    group: 'Renda'
  },
  {
    id: 'contas',
    name: 'Expense',
    icon: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    group: 'Essenciais'
  },
  {
    id: 'transporte',
    name: 'Transport',
    icon: '<path d="M5 11l1.5-5h11L19 11"/><path d="M3 11h18v6H3z"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/>',
    group: 'Essenciais'
  },
  {
    id: 'saude',
    name: 'Health',
    icon: '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z"/>',
    group: 'Essenciais'
  },
  {
    id: 'outros',
    name: 'Other',
    icon: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    group: 'Desejos'
  }
];

const PORTFOLIO_CATEGORY_IDS = new Set(['invest']);
const RESERVE_CATEGORY_IDS = new Set(['reserva']);

export function catById(id: string) {
  return CATS.find((category) => category.id === id);
}

export function isPortfolioCategory(id: string) {
  return PORTFOLIO_CATEGORY_IDS.has(id);
}

export function isReserveCategory(id: string) {
  return RESERVE_CATEGORY_IDS.has(id);
}
