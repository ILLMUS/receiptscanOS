// Guarded service worker registration.
// Only registers in production and outside Lovable preview/dev/iframe contexts.

const SW_PATH = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.map(async (r) => {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(SW_PATH)) {
        try { await r.unregister(); } catch { /* noop */ }
      }
    })
  );
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }
  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox(SW_PATH);
    wb.addEventListener("waiting", () => {
      wb.messageSkipWaiting();
    });
    wb.addEventListener("controlling", () => {
      window.location.reload();
    });
    await wb.register();
  } catch (err) {
    console.warn("SW registration failed", err);
  }
}
