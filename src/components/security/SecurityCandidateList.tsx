import { SecurityRecord } from '@/types/security';
import { getMarketLabel } from '@/lib/security/formatSecurityDisplay';

interface SecurityCandidateListProps {
  candidates: SecurityRecord[];
  onSelect?: (security: SecurityRecord) => void;
}

function CandidateContent({ candidate }: { candidate: SecurityRecord }) {
  return (
    <>
      <div className="mb-2 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm font-semibold leading-snug text-[oklch(0.18_0.014_160)]">
          {candidate.companyName}
        </div>
        <span className="w-fit rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-[oklch(0.45_0.018_160)]">
          {getMarketLabel(candidate.market)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-[oklch(0.45_0.018_160)]">
        {candidate.symbol && (
          <span className="rounded-full border border-border bg-white px-2 py-1 font-mono">
            symbol: {candidate.symbol}
          </span>
        )}
        {candidate.numericCode && (
          <span className="rounded-full border border-border bg-white px-2 py-1 font-mono">
            numericCode: {candidate.numericCode}
          </span>
        )}
        {candidate.chineseNameHK && (
          <span className="rounded-full border border-border bg-white px-2 py-1">
            中文名: {candidate.chineseNameHK}
          </span>
        )}
      </div>
    </>
  );
}

export function SecurityCandidateList({ candidates, onSelect }: SecurityCandidateListProps) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {candidates.map((candidate) => {
        const className = 'w-full rounded-[8px] border border-border bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)]';

        if (onSelect) {
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate)}
              className={className}
            >
              <CandidateContent candidate={candidate} />
            </button>
          );
        }

        return (
          <div key={candidate.id} className={className}>
            <CandidateContent candidate={candidate} />
          </div>
        );
      })}
    </div>
  );
}
