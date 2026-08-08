import type { Receipt } from '@/hooks/use-receipts';
import { getReceiptImageUrl } from '@/lib/image-utils';
import { getCategoryByValue } from '@/lib/categories';

function escapeCsv(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportReceiptsToCsv(receipts: Receipt[]) {
  const headers = ['Store', 'Amount (E)', 'Date', 'Type', 'Category', 'Notes', 'Image URL'];
  const rows = receipts.map((r) => [
    r.store_name ?? '',
    r.amount ?? '',
    r.receipt_date ?? '',
    (r.scope || 'home') === 'business' ? 'Business' : 'Home',
    getCategoryByValue(r.category)?.label ?? r.category ?? '',
    r.notes ?? '',
    r.image_path ? getReceiptImageUrl(r.image_path) : '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `receipts-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
