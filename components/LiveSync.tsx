"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Wifi, AlertTriangle } from "lucide-react";

export function LiveSync() {
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "live" | "expired" | "failed">("syncing");
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  async function syncNow() {
    setStatus("syncing");
    try {
      const response = await fetch("/api/whoop?limit=1", { cache: "no-store" });
      if (response.status === 401) {
        setStatus("expired");
        return;
      }
      if (!response.ok) {
        setStatus("failed");
        return;
      }
      const payload = await response.json();
      setLastSynced(new Date(payload.fetched_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setStatus("live");
      router.refresh();
    } catch {
      setStatus("failed");
    }
  }

  useEffect(() => {
    let mounted = true;
    syncNow().then(() => {
      if (!mounted) return;
    });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        syncNow();
      }
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const label = status === "live" ? `Live · synced ${lastSynced || "now"}` : status === "expired" ? "WHOOP session expired" : status === "failed" ? "Sync failed" : "Syncing live WHOOP";

  return (
    <button
      type="button"
      onClick={syncNow}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 transition hover:border-[#00d4ff]/30 hover:text-[#00d4ff]"
      title="Refresh WHOOP data"
    >
      <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-green-400 shadow-[0_0_14px_rgba(34,197,94,0.7)]" : status === "expired" || status === "failed" ? "bg-[#ff2d55] shadow-[0_0_14px_rgba(255,45,85,0.7)]" : "bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.7)]"}`} />
      {status === "syncing" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : status === "failed" || status === "expired" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
