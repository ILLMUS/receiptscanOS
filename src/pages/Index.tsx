import { useEffect, useMemo, useState } from 'react';
import { Receipt as ReceiptIcon, HardDrive, LogOut, BarChart3, FileText, Download, Briefcase, Tag } from 'lucide-react';
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

const Index = () => {
  const { signOut } = useAuth();
  const { mode, setMode } = useAppMode();
  const { receipts, loading, fetchReceipts, addReceipt, deleteReceipt, updateExtractedData, reExtract, findDuplicate, assignJob, setScope } = useReceipts();
  const { jobs, fetchJobs, addJob, updateJob, deleteJob } = useJobs();
  const [tab, setTab] = useState<'receipts' | 'jobs' | 'prices' | 'dashboard'>('receipts');
  const [filters, setFilters] = useState<ReceiptFilterValues>(emptyFilters);

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

  const scopeTotals = useMemo(() => {
    const t = { home: 0, business: 0 };
    receipts.forEach((r) => { t[(r.scope || 'home') as 'home' | 'business'] += r.amount || 0; });
    return t;
  }, [receipts]);

  useEffect(() => {
    fetchReceipts();
    fetchJobs();
    const onOnline = () => { fetchReceipts(); fetchJobs(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [fetchReceipts, fetchJobs]);

  const totalSizeKb = useMemo(
    () => receipts.reduce((sum, r) => sum + (r.image_size_kb || 0), 0),
    [receipts]
  );

  const uniqueStoreNames = useMemo(
    () => [...new Set(receipts.map((r) => r.store_name).filter(Boolean))] as string[],
    [receipts]
  );

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <ReceiptIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground leading-tight">RST SPILWORKS</h1>
              <p className="text-xs text-muted-foreground">Receipt Scanner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <HardDrive className="h-3.5 w-3.5" />
              <span>{receipts.length}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{totalSizeKb < 1024 ? `${Math.round(totalSizeKb)} KB` : `${(totalSizeKb / 1024).toFixed(1)} MB`}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Home / Business mode */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-1">Mode</span>
          {([
            { key: 'all', label: 'All' },
            { key: 'home', label: 'Home' },
            { key: 'business', label: 'Business' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                mode === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
            {mode === 'business'
              ? `E${scopeTotals.business.toLocaleString('en-SZ', { minimumFractionDigits: 2 })}`
              : mode === 'home'
              ? `E${scopeTotals.home.toLocaleString('en-SZ', { minimumFractionDigits: 2 })}`
              : `Home E${Math.round(scopeTotals.home)} · Biz E${Math.round(scopeTotals.business)}`}
          </span>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex border-t">
          {([
            { key: 'receipts', label: 'Receipts', Icon: FileText },
            { key: 'jobs', label: mode === 'home' ? 'Projects' : 'Jobs', Icon: Briefcase },
            { key: 'prices', label: 'Prices', Icon: Tag },
            { key: 'dashboard', label: 'Stats', Icon: BarChart3 },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {tab === 'receipts' && (
          <>
            <ReceiptUploadForm onSubmit={addReceipt} loading={loading} findDuplicate={findDuplicate} jobs={jobs} />
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
                    className="h-8"
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
    </div>
  );
};

export default Index;
