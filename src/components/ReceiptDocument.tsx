import { useState } from 'react';
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ExtractedData, ReceiptItem } from '@/hooks/use-receipts';

interface ReceiptDocumentProps {
  data: ExtractedData;
  receiptDate?: string | null;
  onSave?: (updated: ExtractedData) => void;
}

export function ReceiptDocument({ data, receiptDate, onSave }: ReceiptDocumentProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ExtractedData>(data);

  const startEdit = () => {
    setDraft({ ...data, items: data.items?.map(i => ({ ...i })) || [] });
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    onSave?.(draft);
    setEditing(false);
  };

  const updateItem = (idx: number, field: keyof ReceiptItem, value: string) => {
    setDraft(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx
          ? { ...item, [field]: field === 'name' ? value : (parseFloat(value) || 0) }
          : item
      ),
    }));
  };

  const removeItem = (idx: number) => {
    setDraft(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const addItem = () => {
    setDraft(prev => ({ ...prev, items: [...prev.items, { name: '', qty: 1, price: 0 }] }));
  };

  const display = editing ? draft : data;

  return (
    <div className="bg-background border rounded-lg p-5 font-mono text-sm space-y-3 shadow-inner relative">
      {/* Edit toggle */}
      {onSave && !editing && (
        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={startEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      )}
      {editing && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button variant="default" size="sm" onClick={save}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
          <Button variant="ghost" size="sm" onClick={cancel}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-1 pt-6">
        {editing ? (
          <Input className="text-center font-bold text-base font-mono" value={draft.store_name} onChange={e => setDraft(p => ({ ...p, store_name: e.target.value }))} />
        ) : (
          <h3 className="font-bold text-base uppercase tracking-wide text-foreground">{display.store_name || 'Receipt'}</h3>
        )}
        {editing ? (
          <Input className="text-center text-xs font-mono" placeholder="Store address" value={draft.store_address || ''} onChange={e => setDraft(p => ({ ...p, store_address: e.target.value || null }))} />
        ) : display.store_address ? (
          <p className="text-xs text-muted-foreground">{display.store_address}</p>
        ) : null}
        {editing ? (
          <Input className="text-center text-xs font-mono" placeholder="Receipt #" value={draft.receipt_number || ''} onChange={e => setDraft(p => ({ ...p, receipt_number: e.target.value || null }))} />
        ) : display.receipt_number ? (
          <p className="text-xs text-muted-foreground">#{display.receipt_number}</p>
        ) : null}
      </div>

      <Separator />

      {/* Date & Time */}
      {editing ? (
        <div className="flex gap-2">
          <Input className="text-xs font-mono flex-1" placeholder="Date" value={draft.date || ''} onChange={e => setDraft(p => ({ ...p, date: e.target.value || null }))} />
          <Input className="text-xs font-mono flex-1" placeholder="Time" value={draft.time || ''} onChange={e => setDraft(p => ({ ...p, time: e.target.value || null }))} />
        </div>
      ) : (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{display.date || receiptDate || '—'}</span>
          {display.time && <span>{display.time}</span>}
        </div>
      )}

      <Separator />

      {/* Items */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {display.items?.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            {editing ? (
              <>
                <Input className="flex-1 text-xs font-mono h-7 px-1" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                <Input className="w-12 text-xs font-mono h-7 px-1 text-right" type="number" value={item.qty ?? 1} onChange={e => updateItem(i, 'qty', e.target.value)} />
                <Input className="w-20 text-xs font-mono h-7 px-1 text-right" type="number" step="0.01" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                <button onClick={() => removeItem(i)} className="text-destructive hover:text-destructive/80 p-0.5">
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate pr-2 text-foreground">
                  {item.qty && item.qty > 1 ? `${item.qty}x ` : ''}{item.name}
                </span>
                <span className="flex-shrink-0 tabular-nums text-foreground">
                  E{Number(item.price).toLocaleString('en-SZ', { minimumFractionDigits: 2 })}
                </span>
              </>
            )}
          </div>
        ))}
        {editing && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        )}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-1">
        {editing ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs w-16">Subtotal</span>
              <Input className="flex-1 text-xs font-mono h-7 text-right" type="number" step="0.01" value={draft.subtotal ?? ''} onChange={e => setDraft(p => ({ ...p, subtotal: e.target.value ? parseFloat(e.target.value) : null }))} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs w-16">Tax</span>
              <Input className="flex-1 text-xs font-mono h-7 text-right" type="number" step="0.01" value={draft.tax ?? ''} onChange={e => setDraft(p => ({ ...p, tax: e.target.value ? parseFloat(e.target.value) : null }))} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs w-16">TOTAL</span>
              <Input className="flex-1 text-xs font-mono h-7 text-right font-bold" type="number" step="0.01" value={draft.total ?? ''} onChange={e => setDraft(p => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : null }))} />
            </div>
          </>
        ) : (
          <>
            {display.subtotal != null && (
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">E{Number(display.subtotal).toLocaleString('en-SZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {display.tax != null && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">E{Number(display.tax).toLocaleString('en-SZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {display.total != null && (
              <div className="flex justify-between font-bold text-foreground text-base">
                <span>TOTAL</span>
                <span className="tabular-nums">E{Number(display.total).toLocaleString('en-SZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Method */}
      {(editing || display.payment_method) && (
        <>
          <Separator />
          {editing ? (
            <Input className="text-center text-xs font-mono" placeholder="Payment method" value={draft.payment_method || ''} onChange={e => setDraft(p => ({ ...p, payment_method: e.target.value || null }))} />
          ) : (
            <div className="text-center text-xs text-muted-foreground">Paid via {display.payment_method}</div>
          )}
        </>
      )}
    </div>
  );
}
