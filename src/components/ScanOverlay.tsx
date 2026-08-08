import { Loader2 } from 'lucide-react';

interface ScanOverlayProps {
  /** Image being "scanned" */
  src: string;
  active: boolean;
  label?: string;
}

/**
 * Flatbed-printer style scanning effect: a bright bar sweeps down the
 * receipt image, leaving a light "scanned" trail and corner registration marks.
 */
export function ScanOverlay({ src, active, label = 'Scanning receipt…' }: ScanOverlayProps) {
  return (
    <div className="relative rounded-lg overflow-hidden bg-muted">
      <img
        src={src}
        alt="Receipt preview"
        className={`w-full max-h-48 object-cover transition-all duration-500 ${
          active ? 'grayscale contrast-125 brightness-95' : ''
        }`}
      />

      {active && (
        <div className="absolute inset-0 pointer-events-none">
          {/* sweeping scan bar */}
          <div className="scan-bar" />
          {/* faint sensor grid */}
          <div className="scan-grid" />
          {/* registration corners */}
          <span className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-primary/80" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-primary/80" />
          <span className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-primary/80" />
          <span className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-primary/80" />

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-[11px] font-medium text-foreground shadow">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
