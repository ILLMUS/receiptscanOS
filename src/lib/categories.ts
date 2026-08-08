export type CategoryScope = 'home' | 'business' | 'both';

export interface Category {
  value: string;
  label: string;
  color: string; // Tailwind bg class
  textColor: string; // Tailwind text class
  scope: CategoryScope;
}

/**
 * Universal category set — works for household spending and any kind of
 * business (trade, retail, services). Values are stable so existing
 * receipts keep their category even though some labels are broader now.
 * `scope` only affects which options are surfaced first in the UI; the
 * stored value never changes, so switching modes can't create conflicts.
 */
export const RECEIPT_CATEGORIES: Category[] = [
  { value: 'groceries', label: 'Groceries & Food', color: 'bg-emerald-100', textColor: 'text-emerald-700', scope: 'home' },
  { value: 'dining', label: 'Dining & Takeaway', color: 'bg-amber-100', textColor: 'text-amber-700', scope: 'both' },
  { value: 'household', label: 'Household & Home', color: 'bg-teal-100', textColor: 'text-teal-700', scope: 'home' },
  { value: 'utilities', label: 'Utilities & Bills', color: 'bg-lime-100', textColor: 'text-lime-700', scope: 'both' },
  { value: 'transport', label: 'Transport & Travel', color: 'bg-purple-100', textColor: 'text-purple-700', scope: 'both' },
  { value: 'fuel_gas', label: 'Fuel & Gas', color: 'bg-yellow-100', textColor: 'text-yellow-700', scope: 'both' },
  { value: 'health', label: 'Health & Medical', color: 'bg-rose-100', textColor: 'text-rose-700', scope: 'home' },
  { value: 'personal', label: 'Personal & Clothing', color: 'bg-fuchsia-100', textColor: 'text-fuchsia-700', scope: 'home' },
  { value: 'education', label: 'Education & Childcare', color: 'bg-indigo-100', textColor: 'text-indigo-700', scope: 'home' },
  { value: 'entertainment', label: 'Entertainment & Leisure', color: 'bg-violet-100', textColor: 'text-violet-700', scope: 'home' },
  { value: 'raw_materials', label: 'Materials & Hardware', color: 'bg-orange-100', textColor: 'text-orange-700', scope: 'both' },
  { value: 'tools_equipment', label: 'Tools & Equipment', color: 'bg-blue-100', textColor: 'text-blue-700', scope: 'both' },
  { value: 'welding_supplies', label: 'Trade & Workshop Supplies', color: 'bg-red-100', textColor: 'text-red-700', scope: 'business' },
  { value: 'ppe_safety', label: 'Safety & Workwear', color: 'bg-green-100', textColor: 'text-green-700', scope: 'business' },
  { value: 'maintenance', label: 'Maintenance & Repairs', color: 'bg-cyan-100', textColor: 'text-cyan-700', scope: 'both' },
  { value: 'subcontractor', label: 'Labour & Services', color: 'bg-pink-100', textColor: 'text-pink-700', scope: 'both' },
  { value: 'office_admin', label: 'Office & Admin', color: 'bg-slate-100', textColor: 'text-slate-700', scope: 'business' },
  { value: 'other', label: 'Other', color: 'bg-gray-100', textColor: 'text-gray-700', scope: 'both' },
];

export function getCategoryByValue(value: string | null | undefined): Category | undefined {
  return RECEIPT_CATEGORIES.find((c) => c.value === value);
}

/**
 * Categories ordered for a given mode: relevant ones first, the rest kept
 * available underneath so nothing is ever hidden or lost.
 */
export function categoriesForMode(mode: 'all' | 'home' | 'business'): Category[] {
  if (mode === 'all') return RECEIPT_CATEGORIES;
  const primary = RECEIPT_CATEGORIES.filter((c) => c.scope === mode || c.scope === 'both');
  const rest = RECEIPT_CATEGORIES.filter((c) => !primary.includes(c));
  return [...primary, ...rest];
}

