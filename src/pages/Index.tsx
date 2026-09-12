import { useEffect, useMemo, useRef, useState } from 'react';
import { Receipt as ReceiptIcon, LogOut, BarChart3, FileText, Download, Briefcase, Tag, Plus, ScanLine } from 'lucide-react';
import { exportReceiptsToCsv } from '@/lib/export-csv';
import { ReceiptUploadForm } from '@/components/ReceiptUploadForm';
import { ReceiptList } from '@/components/ReceiptList';
import { ReceiptFilters, emptyFilters, type ReceiptFilterValues } from '@/components/ReceiptFilters';
import { useReceipts } from '@/hooks/use-receipts';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Dashboard from '@/pages/Dashboard';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useJobs } from '@/hooks/use-jobs';
import Jobs from '@/pages/Jobs';
import Prices from '@/pages/Prices';
import { useAppMode } from '@/hooks/use-app-mode';

type Tab = 'receipts' | 'jobs' | 'prices' | 'dashboard';

const Index = () => {
  const { signOut } = useAuth();
  const { mode, setMode } = useAppMode();
  const { receipts, loading, fetchReceipts, addReceipt, deleteReceipt, updateExtractedData, reExtract, findDuplicate, assignJob, setScope } = useReceipts();
  const { jobs, fetchJobs, addJob, updateJob, deleteJob } = useJobs();
  const [tab, setTab] = useState<Tab>('receipts');
  const [filters, setFilters] = useState<ReceiptFilterValues>(emptyFilters);
  const [autoExpandId, setAutoExpandId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [wasLoading, setWasLoading] = useState(false);
  const uploaderRef = useRef<HTMLDivElement>(null);

  const handleAddReceipt: typeof addReceipt = async (...args) => {
    const id = await addReceipt(...args);
    if (id) {
      setAutoExpandId(id);
      setShowUploader(false);
    }
    return id;
  };

  // Close the uploader once a scan finishes (saving handled above)
  useEffect(() => {
    if (wasLoading && !loading) setWasLoading(false);
    if (loading) setWasLoading(true);
  }, [loading, wasLoading]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (mode !== 'all' && (r.scope || 'home') !== mode) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(r.store_name || '').toLowerCase().includes(q)) return false;
      }
      if (filters.dateFrom && r.receipt_date) {
        if (new Date(r.receipt_date) < filters.dateFrom) return false;
      }
      if (filters.dateTo && r.receipt_date) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(r.receipt_date) > to) return false;
      }
      if (filters.amountMin && (r.amount == null || r.amount < Number(filters.amountMin))) return false;
      if (filters.amountMax && (r.amount == null || r.amount > Number(filters.amountMax))) return false;
      if (filters.category && r.category !== filters.category) return false;
      return true;
    });
  }, [receipts, filters, mode]);

  useEffect(() => {
    fetchReceipts();
    fetchJobs();
    const onOnline = () => { fetchReceipts(); fetchJobs(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [fetchReceipts, fetchJobs]);

  const uniqueStoreNames = useMemo(
    () => [...new Set(receipts.map((r) => r.store_name).filter(Boolean))] as string[],
    [receipts]
  );

  const openScanner = () => {
    setTab('receipts');
    setShowUploader((v) => {
      const next = !v;
      if (next) requestAnimationFrame(() => uploaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return next;
    });
  };

  const navItems = [
    { key: 'receipts' as Tab, label: 'Receipts', Icon: FileText },
    { key: 'jobs' as Tab, label: mode === 'home' ? 'Projects' : 'Jobs', Icon: Briefcase },
    null, // FAB slot
    { key: 'prices' as Tab, label: 'Prices', Icon: Tag },
    { key: 'dashboard' as Tab, label: 'Stats', Icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-muted/50">
      <OfflineBanner />

      {/* ===== App header ===== */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
            <ReceiptIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-foreground leading-tight truncate">RST SPILWORKS</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Receipt Scanner</p>
          </div>

          {/* Mode chips */}
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            {([
              { key: 'all', label: 'All' },
              { key: 'home', label: 'Home' },
              { key: 'business', label: 'Biz' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  mode === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 flex-shrink-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="max-w-lg mx-auto px-4 pt-5 pb-32 space-y-5">
        {tab === 'receipts' && (
          <>
            {/* Scanning banner */}
            {loading && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/50 bg-accent px-4 py-4 flex items-center gap-3">
                <div className="scan-bar" />
                <ScanLine className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-accent-foreground">Scanning receipt…</p>
                  <p className="text-xs text-accent-foreground/70">Reading items and totals with AI</p>
                </div>
              </div>
            )}

            {/* Collapsible scanner (opened via the + button) */}
            {showUploader && (
              <div ref={uploaderRef}>
                <ReceiptUploadForm onSubmit={handleAddReceipt} loading={loading} findDuplicate={findDuplicate} jobs={jobs} />
              </div>
            )}

            <ReceiptFilters filters={filters} onChange={setFilters} storeNames={uniqueStoreNames} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-foreground">Recent Receipts</h2>
                <div className="flex items-center gap-2">
                  {filteredReceipts.length !== receipts.length && (
                    <span className="text-xs text-muted-foreground">{filteredReceipts.length} of {receipts.length}</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full"
                    disabled={filteredReceipts.length === 0}
                    onClick={() => exportReceiptsToCsv(filteredReceipts)}
                  >
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              </div>
              <ReceiptList
                receipts={filteredReceipts}
                onDelete={deleteReceipt}
                onUpdateExtracted={updateExtractedData}
                onReExtract={reExtract}
                loading={loading}
                jobs={jobs}
                onAssignJob={assignJob}
                onSetScope={setScope}
                autoExpandId={autoExpandId}
              />
            </div>
          </>
        )}
        {tab === 'jobs' && (
          <Jobs jobs={jobs} receipts={receipts} onAdd={addJob} onUpdate={updateJob} onDelete={deleteJob} />
        )}
        {tab === 'prices' && <Prices receipts={receipts} />}
        {tab === 'dashboard' && <Dashboard />}
      </main>

      {/* ===== Bottom navigation ===== */}
      <nav className="fixed bottom-0 inset-x-0 z-20">
        <div className="max-w-lg mx-auto bg-card border-t shadow-[0_-4px_20px_-8px_hsl(var(--foreground)/0.15)]">
          <div className="relative grid grid-cols-5 px-2">
            {navItems.map((item, i) =>
              item === null ? (
                <div key="fab" className="flex items-start justify-center">
                  <button
                    onClick={openScanner}
                    aria-label="Scan receipt"
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
                      showUploader ? 'rotate-45' : ''
                    }`}
                  >
                    <Plus className="h-7 w-7" strokeWidth={2.5} />
                  </button>
                  <span className="pb-1.5 pt-8 text-[10px] font-medium text-primary">Scan</span>
                </div>
              ) : (
                <button
                  key={item.key}
                  onClick={() => { setTab(item.key); setShowUploader(false); }}
                  className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                    tab === item.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.Icon className="h-5 w-5" strokeWidth={tab === item.key ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            )}
          </div>
          {/* Android gesture bar */}
          <div className="flex justify-center pb-1.5">
            <div className="w-24 h-1 rounded-full bg-foreground/20" />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
