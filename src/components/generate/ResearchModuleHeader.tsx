'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Clock3, Database, Sparkles } from 'lucide-react';

interface ResearchModuleHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  source?: string;
  generatedBy?: string;
  updatedAt?: string;
  diagnostics?: string[];
}

export function ResearchModuleHeader({
  icon,
  title,
  subtitle,
  source,
  generatedBy,
  updatedAt,
  diagnostics = [],
}: ResearchModuleHeaderProps) {
  const visibleDiagnostics = diagnostics.filter(Boolean).slice(0, 8);

  return (
    <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[var(--brand-ink)]">核心模块</div>
            <h3 className="mt-0.5 text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[oklch(0.42_0.018_160)]">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 lg:max-w-[420px] lg:justify-end">
          {source && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.42_0.018_160)]">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              {source}
            </span>
          )}
          {generatedBy && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {generatedBy}
            </span>
          )}
          {updatedAt && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.42_0.018_160)]">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {updatedAt}
            </span>
          )}
        </div>
      </div>

      {visibleDiagnostics.length > 0 && (
        <details className="mt-3 border-t border-border pt-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            诊断提示 {visibleDiagnostics.length}
          </summary>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[var(--risk-ink)]">
            {visibleDiagnostics.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
