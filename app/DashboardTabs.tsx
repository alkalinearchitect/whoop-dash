"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { BarChart3, Moon, Activity, TrendingUp } from "lucide-react";

type Tab = "overview" | "sleep" | "strain" | "trends";

const TAB_META: { id: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "sleep", label: "Sleep", Icon: Moon },
  { id: "strain", label: "Strain", Icon: Activity },
  { id: "trends", label: "Trends", Icon: TrendingUp },
];

interface Props {
  overviewContent: ReactNode;
  sleepContent: ReactNode;
  strainContent: ReactNode;
  trendsContent: ReactNode;
}

export default function DashboardTabs({ overviewContent, sleepContent, strainContent, trendsContent }: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const content = tab === "overview" ? overviewContent
    : tab === "sleep" ? sleepContent
    : tab === "strain" ? strainContent
    : trendsContent;

  return (
    <>
      {content}
      <div className="tab-bar">
        <div className="tab-bar__inner">
          {TAB_META.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`tab-item ${tab === id ? "active" : ""}`}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
