import { useMemo, useState } from 'react';
import { Briefcase, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { JOB_STATUSES, type Job } from '@/hooks/use-jobs';
import type { Receipt } from '@/hooks/use-receipts';
import { getCategoryByValue } from '@/lib/categories';

interface JobsProps {
  jobs: Job[];
  receipts: Receipt[];
  onAdd: (name: string, client: string, quoted: number | null, notes: string) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Job>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const money = (n: number) => `E${n.toLocaleString('en-SZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Jobs({ jobs, receipts, onAdd, onUpdate, onDelete }: JobsProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [quoted, setQuoted] = useState('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const byJob = useMemo(() => {
    const m = new Map<string, { total: number; receipts: Receipt[] }>();
    for (const r of receipts) {
      if (!r.job_id) continue;
      const e = m.get(r.job_id) || { total: 0, receipts: [] };
      e.total += Number(r.amount) || 0;
      e.receipts.push(r);
      m.set(r.job_id, e);
    }
    return m;
  }, [receipts]);

  const untagged = receipts.filter((r) => !r.job_id);

  const submit = async () => {
    await onAdd(name, client, quoted ? parseFloat(quoted) : null, notes);
    setName(''); setClient(''); setQuoted(''); setNotes(''); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold">Jobs & Projects</h2>
        <Button size="sm" variant={open ? 'outline' : 'default'} onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" /> {open ? 'Close' : 'New job'}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Job or project name (e.g. Kitchen renovation)" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
              <Input placeholder="Quoted (E)" type="number" step="0.01" value={quoted} onChange={(e) => setQuoted(e.target.value)} />
            </div>
            <Textarea placeholder="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button className="w-full" disabled={!name.trim()} onClick={submit}>Create job</Button>
          </CardContent>
        </Card>
      )}

      {jobs.length === 0 && !open && (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-display text-lg">No jobs yet</p>
          <p className="text-sm mt-1">Create a job, then tag receipts to it to see true job cost</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const stats = byJob.get(job.id) || { total: 0, receipts: [] };
          const quotedAmt = Number(job.quoted_amount) || 0;
          const margin = quotedAmt ? quotedAmt - stats.total : null;
          const pct = quotedAmt ? Math.min(100, (stats.total / quotedAmt) * 100) : 0;
          const isOpen = expanded === job.id;

          return (
            <Card key={job.id}>
              <CardContent className="p-4 space-y-3">
                <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : job.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold truncate">{job.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.client || 'No client'} · {stats.receipts.length} receipt{stats.receipts.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-semibold text-primary">{money(stats.total)}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        {JOB_STATUSES.find((s) => s.value === job.status)?.label || job.status}
                      </Badge>
                    </div>
                  </div>
                </button>

                {quotedAmt > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${stats.total > quotedAmt ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Quoted {money(quotedAmt)}</span>
                      <span className={margin != null && margin < 0 ? 'text-destructive font-medium' : 'text-emerald-600 font-medium'}>
                        {margin != null && margin < 0 ? 'Over by ' : 'Margin '}{money(Math.abs(margin || 0))}
                      </span>
                    </div>
                  </div>
                )}

                {isOpen && (
                  <div className="space-y-3 pt-1 border-t">
                    <div className="pt-3 grid grid-cols-2 gap-2">
                      <Select value={job.status} onValueChange={(v) => onUpdate(job.id, { status: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {JOB_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" size="sm" className="h-9" onClick={() => onDelete(job.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>

                    {stats.receipts.length > 0 ? (
                      <div className="space-y-1.5">
                        {stats.receipts.map((r) => {
                          const cat = getCategoryByValue(r.category);
                          return (
                            <div key={r.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate">{r.store_name || 'Unnamed'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {r.receipt_date}{cat ? ` · ${cat.label}` : ''}
                                </p>
                              </div>
                              <span className="font-medium">{money(Number(r.amount) || 0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No receipts tagged to this job yet.</p>
                    )}
                    {job.notes && <p className="text-xs text-muted-foreground">{job.notes}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {jobs.length > 0 && untagged.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          {untagged.length} receipt{untagged.length === 1 ? '' : 's'} not tagged to a job yet
        </p>
      )}
    </div>
  );
}
