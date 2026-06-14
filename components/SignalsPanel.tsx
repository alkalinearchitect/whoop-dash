"use client";

import { useMemo } from "react";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

export interface Signal {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  icon?: React.ReactNode;
  timestamp?: string;
}

interface SignalsPanelProps {
  signals: Signal[];
  loading?: boolean;
  title?: string;
}

const TYPE_CONFIG = {
  warning: {
    icon: AlertTriangle,
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/[0.04]",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    label: "Warning",
    labelColor: "text-amber-400/70",
  },
  info: {
    icon: Info,
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-500/[0.04]",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    label: "Info",
    labelColor: "text-blue-400/70",
  },
  success: {
    icon: CheckCircle,
    borderColor: "border-l-green-500",
    bgColor: "bg-green-500/[0.04]",
    iconColor: "text-green-400",
    iconBg: "bg-green-400/10",
    label: "Good",
    labelColor: "text-green-400/70",
  },
};

export function SignalsPanel({
  signals,
  loading,
  title = "Health Signals",
}: SignalsPanelProps) {
  const sortedSignals = useMemo(() => {
    const order = { warning: 0, info: 1, success: 2 };
    return [...signals].sort(
      (a, b) => (order[a.type] ?? 1) - (order[b.type] ?? 1)
    );
  }, [signals]);

  const counts = useMemo(() => {
    return {
      warning: signals.filter((s) => s.type === "warning").length,
      info: signals.filter((s) => s.type === "info").length,
      success: signals.filter((s) => s.type === "success").length,
    };
  }, [signals]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="h-8 w-36 rounded-lg bg-white/[0.06] mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          <p className="mt-0.5 text-xs text-white/40">
            {signals.length > 0
              ? `${signals.length} active signal${signals.length !== 1 ? "s" : ""}`
              : "All systems nominal"}
          </p>
        </div>
        {signals.length > 0 && (
          <div className="flex gap-2">
            {counts.warning > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-400/70">
                {counts.warning} warning{counts.warning !== 1 ? "s" : ""}
              </span>
            )}
            {counts.success > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-green-400/10 px-2 py-0.5 text-[9px] font-bold text-green-400/70">
                {counts.success} good
              </span>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {signals.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/10 bg-green-500/[0.04] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-400/10">
            <CheckCircle className="h-4.5 w-4.5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-400/80">All Systems Optimal</p>
            <p className="text-[10px] text-white/30">
              No warnings or alerts — you&apos;re in great shape
            </p>
          </div>
        </div>
      )}

      {/* Signal cards */}
      {sortedSignals.length > 0 && (
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {sortedSignals.map((signal) => {
            const config = TYPE_CONFIG[signal.type];
            const IconComponent = config.icon;

            return (
              <div
                key={signal.id}
                className={`group relative overflow-hidden rounded-xl border border-white/[0.04] border-l-2 ${config.borderColor} ${config.bgColor} p-4 transition-all duration-200 hover:border-white/[0.08]`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.iconBg} transition-transform group-hover:scale-110`}
                  >
                    {signal.icon ? (
                      <span className="text-sm">{signal.icon}</span>
                    ) : (
                      <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider ${config.labelColor}`}
                      >
                        {config.label}
                      </span>
                      {signal.timestamp && (
                        <span className="text-[8px] text-white/20">
                          {new Date(signal.timestamp).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] leading-relaxed text-white/65">
                      {signal.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
