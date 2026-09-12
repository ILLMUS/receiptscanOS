import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Sparkles, AlertTriangle, Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { categoriesForMode, getCategoryByValue } from '@/lib/categories';
import { useAppMode } from '@/hooks/use-app-mode';
import { ScanOverlay } from '@/components/ScanOverlay';
import { suggestCategory } from '@/lib/category-suggest';
import type { Receipt } from '@/hooks/use-receipts';
import type { Job } from '@/hooks/use-jobs';

interface ReceiptUploadFormProps {
  onSubmit: (file: File, storeName: string, amount: number | null, date: string, notes: string, category: string, jobId?: string, scope?: 'home' | 'business') => Promise<string | null | void>;
  loading: boolean;
  findDuplicate?: (storeName: string, amount: number | null, date: string) => Receipt | null;
  jobs?: Job[];
}

export function ReceiptUploadForm({ onSubmit, loading, findDuplicate, jobs = [] }: ReceiptUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [jobId, setJobId] = useState('');
  const [scope, setScope] = useState<'home' | 'business'>('home');
  const [scopeTouched, setScopeTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { mode } = useAppMode();
  const categories = categoriesForMode(mode);

  // Default Home/Business from the active mode, unless the user picked one.
  useEffect(() => {
    if (!scopeTouched && mode !== 'all') setScope(mode);
  }, [mode, scopeTouched]);

  // Categories that clearly belong to one side nudge the default too.
  useEffect(() => {
    if (scopeTouched) return;
    const cat = getCategoryByValue(category);
    if (cat && cat.scope !== 'both') setScope(cat.scope);
  }, [category, scopeTouched]);



  // Auto-suggest category when store name changes
  useEffect(() => {
    const suggested = suggestCategory(storeName);
    if (suggested && !category) {
      setCategory(suggested);
      setAutoSuggested(true);
    } else if (suggested && autoSuggested) {
      setCategory(suggested);
    }
  }, [storeName]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const [duplicate, setDuplicate] = useState<Receipt | null>(null);

  const doSave = async () => {
    if (!file) return;
    setDuplicate(null);
    await onSubmit(file, storeName, amount ? parseFloat(amount) : null, date, notes, category, jobId || undefined, scope);
    setFile(null);
    setPreview(null);
    setStoreName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setCategory('');
    setJobId('');
    setAutoSuggested(false);
    setScopeTouched(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const amt = amount ? parseFloat(amount) : null;
    const dup = findDuplicate?.(storeName, amt, date);
    if (dup) {
      setDuplicate(dup);
      return;
    }
    await doSave();
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">Scan Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview ? (
          <div className="relative">
            <ScanOverlay src={preview} active={loading} label="Scanning & reading receipt…" />
            {!loading && (
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-foreground/70 text-background rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-20 flex-col gap-1"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Camera</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-20 flex-col gap-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Upload</span>
            </Button>
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />

        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Input placeholder="Amount (E)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['home', 'business'] as const).map((s2) => (
            <button
              key={s2}
              type="button"
              onClick={() => { setScope(s2); setScopeTouched(true); }}
              className={`flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-medium capitalize transition-colors ${
                scope === s2
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-input bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {s2 === 'home' ? <Home className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
              {s2}
            </button>
          ))}
        </div>

        <div className="relative">
          <Select value={category} onValueChange={(val) => { setCategory(val); setAutoSuggested(false); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${cat.color} border ${cat.textColor.replace('text-', 'border-')}`} />
                    {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {autoSuggested && category && (
            <span className="flex items-center gap-1 text-xs text-primary mt-1">
              <Sparkles className="h-3 w-3" /> Auto-suggested
            </span>
          )}
        </div>

        {jobs.length > 0 && (
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger>
              <SelectValue placeholder="Tag to a job (optional)..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

        <Button onClick={handleSubmit} disabled={!file || loading} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning &amp; saving...</> : 'Save Receipt'}
        </Button>
      </CardContent>

      <AlertDialog open={!!duplicate} onOpenChange={(o) => !o && setDuplicate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Possible duplicate receipt
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>A receipt with the same store, amount and date already exists:</p>
                {duplicate && (
                  <div className="rounded-md border bg-muted/50 p-3 text-sm text-foreground">
                    <div><span className="text-muted-foreground">Store:</span> {duplicate.store_name}</div>
                    <div><span className="text-muted-foreground">Amount:</span> E{Number(duplicate.amount).toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Date:</span> {duplicate.receipt_date}</div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Save anyway if this is a separate transaction.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSave}>Save anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
