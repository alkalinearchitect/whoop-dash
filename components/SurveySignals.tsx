"use client";

import { useMemo } from "react";
import { AlertTriangle, Info, CheckCircle, Moon, Heart, Thermometer, Activity } from "lucide-react";

export interface SurveySignal {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  icon?: "alert" | "info" | "check" | "moon" | "heart" | "temp" | "activity";
  timestamp?: string;
}

interface SurveySignalsProps {
  signals: SurveySignal[];
  explanation: string;
  loading?: boolean;
}

const ICON_MAP = {
  alert: AlertTriangle,
  info: Info,
  check: CheckCircle,
  moon: Moon,
  heart: Heart,
  temp: Thermometer,
  activity: Activity,
};

const TYPE_STYLES = {
  warning: { border: "border-l-amber-500", bg: "bg-amber-500/[0.04]", iconBg: "bg-amber-400/10", iconColor: "text-amber-400", label: "Warning", labelColor: "text-amber-400/70" },
  info:    { border: "border-l-blue-500",   bg: "bg-blue-500/[0.04]",   iconBg: "bg-blue-400/10",   iconColor: "text-blue-400",   label: "Info",    labelColor: "text-blue-400/70" },
  success: { border: "border-l-green-500",  bg: "bg-green-500/[0.04]",  iconBg: "bg-green-400/10",  iconColor: "text-green-400",  label: "Good",    labelColor: "text-green-400/70" },
};

export function SurveySignals({ signals, explanation, loading = false }: SurveySignalsProps) {
  const sorted = useMemo(() => {
    const order = { warning: 0, info: 1, success: 2 };
    return [...signals].sort((a, b) => (order[a.type] ?? 1) - (order[b.type] ?? 1));
  }, [signals]);

  if (loading) {
    return (
      <div className="glass p-5">
        <div className="skeleton skeleton--title mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <p className="section-title">Health Signals</p>
      <p className="explanation">{explanation}</p>

      {signals.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/10 bg-green-500/[0.04] p-4 mt-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-400/80">All Systems Optimal</p>
            <p className="text-[10px] text-white/30">No warnings or alerts — you&apos;re in great shape.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mt-3 max-h-[360px] overflow-y-auto">
          {sorted.map(signal => {
            const style = TYPE_STYLES[signal.type];
            const IconComp = ICON_MAP[signal.icon ?? (signal.type === "warning" ? "alert" : signal.type === "success" ? "check" : "info")];
            return (
              <div key={signal.id} className={`flex items-start gap-3 rounded-xl border border-white/[0.04] border-l-2 ${style.border} ${style.bg} p-3`}>
                <div className={`flex w-7 h-7 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
                  <IconComp className={`w-3.5 h-3.5 ${style.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${style.labelColor}`}>{style.label}</span>
                  <p className="text-[11px] leading-relaxed text-white/65 mt-0.5">{signal.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
