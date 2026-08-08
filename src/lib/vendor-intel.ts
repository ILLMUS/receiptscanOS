import type { Receipt } from '@/hooks/use-receipts';

export interface PricePoint {
  receiptId: string;
  store: string;
  date: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface MaterialSummary {
  key: string;
  name: string;
  points: PricePoint[]; // sorted oldest -> newest
  latest: PricePoint;
  previous: PricePoint | null;
  changePct: number | null;
  cheapest: PricePoint;
  dearest: PricePoint;
  avgPrice: number;
  totalSpent: number;
  vendorCount: number;
}

export interface VendorSummary {
  store: string;
  receiptCount: number;
  totalSpent: number;
  avgReceipt: number;
  lastDate: string;
  itemCount: number;
  cheapestOn: string[]; // material names where this vendor is cheapest
  spentThisYear: number;
  spentLastYear: number;
  yoyPct: number | null;
  monthly: { month: string; total: number }[]; // last 12 months, oldest -> newest
}

/** Per-vendor price stats for a single material. */
export interface VendorPrice {
  store: string;
  avgPrice: number;
  latestPrice: number;
  lastDate: string;
  purchases: number;
}

/** Latest purchase vs the average of the previous up-to-3 buys from the SAME vendor. */
export interface PriceAlert {
  key: string;
  material: string;
  store: string;
  latestPrice: number;
  baselinePrice: number;
  baselineCount: number;
  changePct: number;
  date: string;
}


function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildMaterialIndex(receipts: Receipt[]): MaterialSummary[] {
  const map = new Map<string, { name: string; points: PricePoint[] }>();

  for (const r of receipts) {
    const items = r.extracted_data?.items;
    if (!items?.length) continue;
    const store = (r.store_name || 'Unknown vendor').trim();
    const date = r.receipt_date || r.created_at.slice(0, 10);

    for (const item of items) {
      if (!item?.name) continue;
      const key = normalize(item.name);
      if (!key || key.length < 2) continue;
      const qty = Number(item.qty) > 0 ? Number(item.qty) : 1;
      const lineTotal = Number(item.price) || 0;
      if (lineTotal <= 0) continue;
      const unitPrice = lineTotal / qty;
      if (!map.has(key)) map.set(key, { name: item.name.trim(), points: [] });
      map.get(key)!.points.push({ receiptId: r.id, store, date, qty, unitPrice, lineTotal });
    }
  }

  const out: MaterialSummary[] = [];
  for (const [key, { name, points }] of map) {
    points.sort((a, b) => a.date.localeCompare(b.date));
    const latest = points[points.length - 1];
    const previous = points.length > 1 ? points[points.length - 2] : null;
    const changePct = previous && previous.unitPrice > 0
      ? ((latest.unitPrice - previous.unitPrice) / previous.unitPrice) * 100
      : null;
    const sortedByPrice = [...points].sort((a, b) => a.unitPrice - b.unitPrice);
    out.push({
      key,
      name,
      points,
      latest,
      previous,
      changePct,
      cheapest: sortedByPrice[0],
      dearest: sortedByPrice[sortedByPrice.length - 1],
      avgPrice: points.reduce((s, p) => s + p.unitPrice, 0) / points.length,
      totalSpent: points.reduce((s, p) => s + p.lineTotal, 0),
      vendorCount: new Set(points.map((p) => p.store.toLowerCase())).size,
    });
  }

  return out.sort((a, b) => b.totalSpent - a.totalSpent);
}

function monthKeys(count = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function buildVendorIndex(receipts: Receipt[], materials: MaterialSummary[]): VendorSummary[] {
  const map = new Map<string, VendorSummary>();
  const months = monthKeys();
  const thisYear = String(new Date().getFullYear());
  const lastYear = String(new Date().getFullYear() - 1);

  for (const r of receipts) {
    const store = (r.store_name || 'Unknown vendor').trim();
    const k = store.toLowerCase();
    const date = r.receipt_date || r.created_at.slice(0, 10);
    const existing: VendorSummary = map.get(k) || {
      store, receiptCount: 0, totalSpent: 0, avgReceipt: 0, lastDate: date, itemCount: 0, cheapestOn: [],
      spentThisYear: 0, spentLastYear: 0, yoyPct: null,
      monthly: months.map((month) => ({ month, total: 0 })),
    };
    const amount = Number(r.amount) || 0;
    existing.receiptCount += 1;
    existing.totalSpent += amount;
    existing.itemCount += r.extracted_data?.items?.length || 0;
    if (date > existing.lastDate) existing.lastDate = date;
    if (date.startsWith(thisYear)) existing.spentThisYear += amount;
    if (date.startsWith(lastYear)) existing.spentLastYear += amount;
    const bucket = existing.monthly.find((m) => m.month === date.slice(0, 7));
    if (bucket) bucket.total += amount;
    map.set(k, existing);
  }

  for (const m of materials) {
    if (m.vendorCount < 2) continue;
    const v = map.get(m.cheapest.store.toLowerCase());
    if (v) v.cheapestOn.push(m.name);
  }

  return [...map.values()]
    .map((v) => ({
      ...v,
      avgReceipt: v.receiptCount ? v.totalSpent / v.receiptCount : 0,
      yoyPct: v.spentLastYear > 0 ? ((v.spentThisYear - v.spentLastYear) / v.spentLastYear) * 100 : null,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

/** Per-vendor price comparison for one material, cheapest first. */
export function vendorPricesFor(material: MaterialSummary): VendorPrice[] {
  const map = new Map<string, VendorPrice & { sum: number }>();
  for (const p of material.points) {
    const k = p.store.toLowerCase();
    const e = map.get(k) || { store: p.store, avgPrice: 0, latestPrice: p.unitPrice, lastDate: p.date, purchases: 0, sum: 0 };
    e.sum += p.unitPrice;
    e.purchases += 1;
    if (p.date >= e.lastDate) { e.lastDate = p.date; e.latestPrice = p.unitPrice; }
    map.set(k, e);
  }
  return [...map.values()]
    .map(({ sum, ...v }) => ({ ...v, avgPrice: sum / v.purchases }))
    .sort((a, b) => a.avgPrice - b.avgPrice);
}

/**
 * Price alerts: latest unit price vs the average of the previous up-to-3 purchases
 * of the same material from the SAME vendor.
 */
export function priceAlerts(materials: MaterialSummary[], thresholdPct = 5, lookback = 3): PriceAlert[] {
  const alerts: PriceAlert[] = [];

  for (const m of materials) {
    const byVendor = new Map<string, PricePoint[]>();
    for (const p of m.points) {
      const k = p.store.toLowerCase();
      byVendor.set(k, [...(byVendor.get(k) || []), p]);
    }
    for (const points of byVendor.values()) {
      if (points.length < 2) continue;
      const latest = points[points.length - 1];
      const prior = points.slice(Math.max(0, points.length - 1 - lookback), points.length - 1);
      const baseline = prior.reduce((s, p) => s + p.unitPrice, 0) / prior.length;
      if (baseline <= 0) continue;
      const changePct = ((latest.unitPrice - baseline) / baseline) * 100;
      if (changePct < thresholdPct) continue;
      alerts.push({
        key: `${m.key}|${latest.store.toLowerCase()}`,
        material: m.name,
        store: latest.store,
        latestPrice: latest.unitPrice,
        baselinePrice: baseline,
        baselineCount: prior.length,
        changePct,
        date: latest.date,
      });
    }
  }

  return alerts.sort((a, b) => b.changePct - a.changePct);
}


/** Potential saving if every purchase had been made at the cheapest observed unit price. */
export function savingsOpportunity(materials: MaterialSummary[]) {
  return materials.reduce((sum, m) => {
    if (m.vendorCount < 2) return sum;
    const best = m.cheapest.unitPrice;
    const wasted = m.points.reduce((s, p) => s + Math.max(0, (p.unitPrice - best) * p.qty), 0);
    return sum + wasted;
  }, 0);
}
