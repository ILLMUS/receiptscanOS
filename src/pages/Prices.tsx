import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Store, Package, PiggyBank, AlertTriangle, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Receipt } from '@/hooks/use-receipts';
import { buildMaterialIndex, buildVendorIndex, priceAlerts, savingsOpportunity, vendorPricesFor } from '@/lib/vendor-intel';

const money = (n: number) => `E${n.toLocaleString('en-SZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Prices({ receipts }: { receipts: Receipt[] }) {
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [view, setView] = useState<'materials' | 'vendors'>('materials');

  const materials = useMemo(() => buildMaterialIndex(receipts), [receipts]);
  const vendors = useMemo(() => buildVendorIndex(receipts, materials), [receipts, materials]);
  const alerts = useMemo(() => priceAlerts(materials), [materials]);
  const savings = useMemo(() => savingsOpportunity(materials), [materials]);
  const year = new Date().getFullYear();

  const filtered = useMemo(
    () => materials.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())),
    [materials, q]
  );

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="font-display text-lg">No item price data yet</p>
        <p className="text-sm mt-1">Upload receipts — line items are extracted automatically to build your price history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Items tracked</p>
            <p className="font-display text-xl font-bold">{materials.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><PiggyBank className="h-3.5 w-3.5" /> Possible savings</p>
            <p className="font-display text-xl font-bold text-emerald-600">{money(savings)}</p>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Price increases
            </p>
            {alerts.slice(0, 5).map((a) => (
              <div key={a.key} className="text-xs text-amber-900">
                <div className="flex justify-between gap-2">
                  <span className="truncate pr-2 font-medium">{a.material} <span className="opacity-70 font-normal">@ {a.store}</span></span>
                  <span className="font-semibold whitespace-nowrap">+{a.changePct.toFixed(1)}%</span>
                </div>
                <p className="opacity-80">
                  {money(a.latestPrice)} vs {money(a.baselinePrice)} avg of last {a.baselineCount} receipt{a.baselineCount === 1 ? '' : 's'} from same vendor
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}


      <div className="flex rounded-lg bg-muted p-1">
        {(['materials', 'vendors'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 text-sm py-1.5 rounded-md capitalize transition-colors ${
              view === v ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'
            }`}
          >
            {v === 'materials' ? 'items' : v}
          </button>
        ))}
      </div>

      {view === 'materials' ? (
        <>
          <Input placeholder="Search items..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="space-y-2">
            {filtered.map((m) => {
              const up = (m.changePct ?? 0) > 0;
              const isOpen = openKey === m.key;
              return (
                <Card key={m.key}>
                  <CardContent className="p-3">
                    <button className="w-full text-left" onClick={() => setOpenKey(isOpen ? null : m.key)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.points.length} purchase{m.points.length === 1 ? '' : 's'} · {m.vendorCount} vendor{m.vendorCount === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-semibold">{money(m.latest.unitPrice)}</p>
                          {m.changePct != null && (
                            <span className={`text-xs flex items-center justify-end gap-0.5 ${up ? 'text-destructive' : 'text-emerald-600'}`}>
                              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(m.changePct).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div><p className="text-muted-foreground">Cheapest</p><p className="font-medium">{money(m.cheapest.unitPrice)}</p><p className="text-muted-foreground truncate">{m.cheapest.store}</p></div>
                          <div><p className="text-muted-foreground">Average</p><p className="font-medium">{money(m.avgPrice)}</p></div>
                          <div><p className="text-muted-foreground">Highest</p><p className="font-medium">{money(m.dearest.unitPrice)}</p><p className="text-muted-foreground truncate">{m.dearest.store}</p></div>
                        </div>

                        <div>
                          <p className="text-xs font-medium mb-1 flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-emerald-600" /> Supplier comparison</p>
                          <div className="space-y-1">
                            {vendorPricesFor(m).map((vp, i) => (
                              <div key={vp.store} className={`flex justify-between text-xs rounded px-2 py-1.5 ${i === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-muted/50'}`}>
                                <span className="truncate pr-2">{i === 0 ? '★ ' : ''}{vp.store} <span className="opacity-70">({vp.purchases})</span></span>
                                <span className="whitespace-nowrap">
                                  {money(vp.avgPrice)}
                                  {i > 0 && vendorPricesFor(m)[0].avgPrice > 0 && (
                                    <span className="text-destructive ml-1">+{(((vp.avgPrice - vendorPricesFor(m)[0].avgPrice) / vendorPricesFor(m)[0].avgPrice) * 100).toFixed(0)}%</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {[...m.points].reverse().map((p, i) => (
                            <div key={i} className="flex justify-between text-xs bg-muted/50 rounded px-2 py-1.5">
                              <span className="truncate pr-2">{p.date} · {p.store}</span>
                              <span className="whitespace-nowrap">{p.qty} × {money(p.unitPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {vendors.map((v) => {
            const peak = Math.max(...v.monthly.map((m) => m.total), 1);
            return (
              <Card key={v.store}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-muted-foreground" />{v.store}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.receiptCount} receipt{v.receiptCount === 1 ? '' : 's'} · avg {money(v.avgReceipt)} · last {v.lastDate}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-semibold text-primary whitespace-nowrap">{money(v.spentThisYear)}</p>
                      <p className="text-[10px] text-muted-foreground">in {year}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    All-time {money(v.totalSpent)}
                    {v.yoyPct != null && (
                      <span className={v.yoyPct >= 0 ? 'text-destructive ml-1.5' : 'text-emerald-600 ml-1.5'}>
                        {v.yoyPct >= 0 ? '↑' : '↓'} {Math.abs(v.yoyPct).toFixed(0)}% vs {year - 1}
                      </span>
                    )}
                  </p>

                  <div className="mt-2 flex items-end gap-[3px] h-10">
                    {v.monthly.map((m) => (
                      <div key={m.month} className="flex-1 bg-primary/15 rounded-sm relative" title={`${m.month}: ${money(m.total)}`}>
                        <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-sm" style={{ height: `${(m.total / peak) * 40}px` }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Spend, last 12 months</p>

                  {v.cheapestOn.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">Best price on</Badge>
                      {v.cheapestOn.slice(0, 4).map((n) => (
                        <span key={n} className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">{n}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
