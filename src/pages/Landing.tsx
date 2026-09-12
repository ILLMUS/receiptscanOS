import { Link } from 'react-router-dom';
import {
  Receipt as ReceiptIcon, Camera, ScanLine, BarChart3, Briefcase, Tag, Shield,
  WifiOff, Download, Sparkles, Home, Building2, ChevronRight, Check, FileText, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

/* ---------- Android-style phone mockup ---------- */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Frame */}
      <div className="rounded-[2.4rem] border-[10px] border-foreground/90 bg-background shadow-[0_30px_60px_-15px_hsl(var(--foreground)/0.35)] overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] text-muted-foreground">
          <span>08:46</span>
          <div className="w-16 h-4 bg-foreground/90 rounded-full" /> {/* punch-hole camera bar */}
          <span className="flex gap-1 items-center">
            <span className="inline-block w-3 h-2 rounded-[2px] bg-muted-foreground/60" />
            <span className="inline-block w-4 h-2 rounded-[2px] bg-muted-foreground/60" />
          </span>
        </div>
        {/* App bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-card border-b">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <ReceiptIcon className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-display font-bold">RST SPILWORKS</p>
            <p className="text-[8px] text-muted-foreground">Receipt Scanner</p>
          </div>
          <div className="ml-auto flex gap-1">
            {['All', 'Home', 'Biz'].map((m, i) => (
              <span key={m} className={`text-[8px] px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{m}</span>
            ))}
          </div>
        </div>
        {/* Receipt cards */}
        <div className="px-3 py-3 space-y-2 bg-background min-h-[300px]">
          {[
            { store: 'Build It Hardware', amt: 'E1,250.00', cat: 'Materials', color: 'bg-primary', scope: 'Biz' },
            { store: 'Spar Supermarket', amt: 'E486.50', cat: 'Groceries', color: 'bg-success', scope: 'Home' },
            { store: 'EEC Utilities', amt: 'E320.00', cat: 'Utilities', color: 'bg-accent-foreground', scope: 'Home' },
          ].map((r) => (
            <div key={r.store} className="bg-card rounded-xl border p-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${r.color} flex items-center justify-center`}>
                  <ReceiptIcon className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[10px] font-semibold">{r.store}</p>
                  <p className="text-[8px] text-muted-foreground">{r.cat} · {r.scope}</p>
                </div>
                <p className="text-[10px] font-bold tabular-nums">{r.amt}</p>
              </div>
              {/* mini document lines */}
              <div className="mt-2 space-y-1">
                <div className="h-1 rounded bg-muted w-3/4" />
                <div className="h-1 rounded bg-muted w-1/2" />
              </div>
            </div>
          ))}
          {/* Scan bar animation */}
          <div className="relative h-10 rounded-xl border-2 border-dashed border-primary/50 overflow-hidden bg-accent">
            <div className="scan-bar" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 text-[9px] text-accent-foreground font-medium">
              <ScanLine className="h-3 w-3" /> Scanning receipt…
            </div>
          </div>
        </div>
        {/* Android nav: FAB + bottom bar */}
        <div className="relative bg-card border-t px-6 py-2 flex items-center justify-around">
          <FileText className="h-4 w-4 text-primary" />
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <div className="w-10 h-10 -mt-6 rounded-2xl bg-primary shadow-lg shadow-primary/40 flex items-center justify-center">
            <Plus className="h-5 w-5 text-primary-foreground" />
          </div>
          <Tag className="h-4 w-4 text-muted-foreground" />
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Gesture bar */}
        <div className="bg-card pb-2 pt-1 flex justify-center">
          <div className="w-20 h-1 rounded-full bg-foreground/30" />
        </div>
      </div>
      {/* Glow behind phone */}
      <div className="absolute -inset-8 -z-10 rounded-full bg-primary/15 blur-3xl" />
    </div>
  );
}

/* ---------- Feature card ---------- */
function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-card rounded-3xl border p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-accent-foreground" />
      </div>
      <h3 className="font-display font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

const features = [
  { icon: Camera, title: 'Point & scan', desc: 'Snap any receipt — the printer-style scanner compresses it to KBs and reads every line automatically.' },
  { icon: Sparkles, title: 'AI document builder', desc: 'A clean, editable document with store, items, quantities and totals is generated the moment you upload.' },
  { icon: Home, title: 'Home & Business modes', desc: 'One tap splits household spending from business costs — separate totals, categories and reports, zero conflicts.' },
  { icon: Briefcase, title: 'Job cost tracking', desc: 'Tag receipts to a job or project and see true cost vs quoted, with margin and over-budget warnings.' },
  { icon: Tag, title: 'Vendor intelligence', desc: 'Price history per item, cheapest-supplier comparison, and alerts when a vendor raises prices.' },
  { icon: BarChart3, title: 'Spending dashboard', desc: 'Daily, weekly and monthly totals in Emalangeni with category pie charts and store breakdowns.' },
  { icon: WifiOff, title: 'Works offline', desc: 'Install it to your home screen — capture receipts with no signal, everything syncs when you\'re back.' },
  { icon: Shield, title: 'Private by default', desc: 'Your receipts are locked to your account with row-level security. Duplicate detection keeps records clean.' },
];

const steps = [
  { icon: Camera, title: 'Snap', desc: 'Take a photo of any receipt — shop, supplier or fuel station.' },
  { icon: ScanLine, title: 'Scan', desc: 'AI reads the image and builds an editable document in seconds.' },
  { icon: BarChart3, title: 'See it all', desc: 'Track spend per category, job and vendor — home and business apart.' },
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/app' : '/auth';

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <ReceiptIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="font-display font-bold text-sm">RST SPILWORKS</p>
              <p className="text-[11px] text-muted-foreground">Receipt Scanner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={cta}>
              <Button variant="ghost" size="sm" className="rounded-full">Sign in</Button>
            </Link>
            <Link to={cta}>
              <Button size="sm" className="rounded-full shadow-lg shadow-primary/30">
                Open app <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent text-accent-foreground px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered · Made for Eswatini
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
              Every receipt,<br />
              <span className="text-primary">scanned & sorted.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Snap a photo and get a clean digital document in seconds. Track home and business spending side by side — in Emalangeni, online or off.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to={cta}>
                <Button size="lg" className="rounded-full h-12 px-8 shadow-xl shadow-primary/30 w-full sm:w-auto">
                  <Camera className="h-5 w-5" /> Start scanning free
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="rounded-full h-12 px-8 w-full sm:w-auto">
                  See features
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
              {['No credit card', 'Works offline', 'Home & business'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> {t}</span>
              ))}
            </div>
          </div>
          <PhoneMockup />
        </div>
      </section>

      {/* Mode chips strip */}
      <section className="border-y bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground mr-1">One app, two lives:</span>
          <span className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium"><Home className="h-4 w-4 text-primary" /> Home &amp; family</span>
          <span className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium"><Building2 className="h-4 w-4 text-primary" /> Business &amp; jobs</span>
        </div>
      </section>

      {/* Features — Material You style grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Built for real work</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">From a grocery slip to a steel order — everything lands in the right place, with the numbers already done.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => <Feature key={f.title} {...f} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">Three taps. That's it.</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="w-16 h-16 rounded-[1.4rem] bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
                  <s.icon className="h-7 w-7" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-xs font-bold bg-background border rounded-full w-6 h-6 flex items-center justify-center">{i + 1}</span>
                <h3 className="font-display font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="bg-primary rounded-[2.5rem] px-6 py-14 sm:py-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,hsl(0_0%_100%/0.15),transparent)]" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 relative">Stop losing receipts.</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto relative">Your first scan takes less time than reading this page.</p>
          <Link to={cta} className="relative">
            <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 shadow-xl">
              <Download className="h-5 w-5" /> Get the app
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <ReceiptIcon className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">RST SPILWORKS</span>
          </div>
          <p>Receipt scanning for home &amp; business · Eswatini</p>
        </div>
      </footer>
    </div>
  );
}
