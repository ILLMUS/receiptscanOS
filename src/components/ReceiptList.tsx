import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, FileText, Image, RotateCcw, Home, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReceiptDocument } from '@/components/ReceiptDocument';
import type { Receipt, ExtractedData } from '@/hooks/use-receipts';
import { getReceiptImageUrl } from '@/lib/image-utils';
import { getCategoryByValue } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Job } from '@/hooks/use-jobs';

interface ReceiptListProps {
  receipts: Receipt[];
  onDelete: (receipt: Receipt) => void;
  onUpdateExtracted?: (receiptId: string, data: ExtractedData) => void;
  onReExtract?: (receipt: Receipt) => void;
  loading?: boolean;
  jobs?: Job[];
  onAssignJob?: (receiptId: string, jobId: string | null) => void;
  onSetScope?: (receiptId: string, scope: 'home' | 'business') => void;
}

export function ReceiptList({ receipts, onDelete, onUpdateExtracted, onReExtract, loading, jobs = [], onAssignJob, onSetScope }: ReceiptListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImage, setShowImage] = useState<Record<string, boolean>>({});

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-display text-lg">No receipts yet</p>
        <p className="text-sm mt-1">Upload your first receipt above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {receipts.map((r) => {
        const expanded = expandedId === r.id;
        const hasExtracted = r.extracted_data && r.extracted_data.items && r.extracted_data.items.length > 0;
        const viewingImage = showImage[r.id];
        const cat = getCategoryByValue(r.category);
        const job = jobs.find((j) => j.id === r.job_id);

        return (
          <Card key={r.id} className="overflow-hidden transition-all">
            <CardContent className="p-0">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expanded ? null : r.id)}
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate font-display">{r.store_name || 'Unnamed receipt'}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-sm text-muted-foreground">{r.receipt_date}</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      (r.scope || 'home') === 'business'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {(r.scope || 'home') === 'business'
                        ? <><Building2 className="h-3 w-3" /> Business</>
                        : <><Home className="h-3 w-3" /> Home</>}
                    </span>
                    {cat && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cat.color} ${cat.textColor}`}>
                        {cat.label}
                      </span>
                    )}
                    {job && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                        {job.name}
                      </span>
                    )}
                    {hasExtracted && <Badge variant="secondary" className="text-xs">AI extracted</Badge>}
                    {r.image_size_kb && <Badge variant="outline" className="text-xs">{r.image_size_kb} KB</Badge>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {r.amount && (
                    <p className="font-semibold text-primary font-display">
                      E{Number(r.amount).toLocaleString('en-SZ', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {expanded ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                </div>
              </button>

              {expanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/30">
                  {r.image_path && hasExtracted && (
                    <div className="flex gap-2">
                      <Button variant={!viewingImage ? "default" : "outline"} size="sm" onClick={() => setShowImage(prev => ({ ...prev, [r.id]: false }))}>
                        <FileText className="h-4 w-4 mr-1" /> Document
                      </Button>
                      <Button variant={viewingImage ? "default" : "outline"} size="sm" onClick={() => setShowImage(prev => ({ ...prev, [r.id]: true }))}>
                        <Image className="h-4 w-4 mr-1" /> Original
                      </Button>
                    </div>
                  )}

                  {hasExtracted && !viewingImage ? (
                    <ReceiptDocument
                      data={r.extracted_data!}
                      receiptDate={r.receipt_date}
                      onSave={onUpdateExtracted ? (updated) => onUpdateExtracted(r.id, updated) : undefined}
                    />
                  ) : r.image_path ? (
                    <img src={getReceiptImageUrl(r.image_path)} alt="Receipt" className="w-full max-h-80 object-contain rounded-lg" />
                  ) : null}

                  {onSetScope && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Counts towards</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['home', 'business'] as const).map((sc) => (
                          <button
                            key={sc}
                            onClick={() => onSetScope(r.id, sc)}
                            className={`flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium capitalize transition-colors ${
                              (r.scope || 'home') === sc
                                ? 'border-primary bg-accent text-accent-foreground'
                                : 'border-input bg-background text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {sc === 'home' ? <Home className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                            {sc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {onAssignJob && jobs.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-muted-foreground mb-1">Job / project</p>
                      <Select
                        value={r.job_id || 'none'}
                        onValueChange={(v) => onAssignJob(r.id, v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="h-9"><SelectValue placeholder="No job" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No job</SelectItem>
                          {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
                  <div className="flex gap-2">
                    {r.image_path && onReExtract && (
                      <Button variant="outline" size="sm" disabled={loading} onClick={(e) => { e.stopPropagation(); onReExtract(r); }}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Re-extract
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(r); }}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
