import { ConsensusEstimate } from './types';
import { EarningsSnapshotData } from '@/types/earnings';

interface SelectionResult<T> {
  estimate: T | undefined;
  sourceNoteSuffix: string | undefined;
  reason: string;
}

// Helper to parse year/quarter from string like "2023Q1"
function parseQuarter(
  fiscalYear?: string,
  fiscalQuarter?: string
): { year: number; quarter: number } | undefined {
  if (!fiscalYear) return undefined;

  const year = Number(fiscalYear);
  if (!Number.isFinite(year)) return undefined;

  // Extract quarter number from fiscalQuarter (e.g., "Q1" -> 1)
  let quarter = 1;
  if (fiscalQuarter) {
    const qMatch = fiscalQuarter.match(/Q?(\d)/i);
    if (qMatch) {
      quarter = Number(qMatch[1]);
    }
  }

  return { year, quarter };
}

// Helper to check if estimate is likely full-year
function isFullYearEstimate(estimate: ConsensusEstimate): boolean {
  // If there's a fiscalYear but no fiscalQuarter, it's likely full-year
  if (estimate.fiscalYear && !estimate.fiscalQuarter) {
    return true;
  }

  // Check quarter label hints
  const q = (estimate.fiscalQuarter || '').toLowerCase();
  if (q.includes('fy') || q.includes('full') || q === 'annual') {
    return true;
  }

  return false;
}

// Helper to compare two estimates recency by date
function getDateValue(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  try {
    return new Date(dateStr).getTime();
  } catch {
    return 0;
  }
}

// Sort estimates by recency
function sortByRecency(estimates: ConsensusEstimate[]): ConsensusEstimate[] {
  return [...estimates].sort((a, b) => {
    const aDate = getDateValue(a.periodEndDate) || getDateValue(a.reportDate);
    const bDate = getDateValue(b.periodEndDate) || getDateValue(b.reportDate);
    return bDate - aDate; // Most recent first
  });
}

// Select current quarter consensus estimate
export function selectCurrentQuarterConsensus(
  estimates: ConsensusEstimate[],
  earningsSnapshot?: EarningsSnapshotData
): SelectionResult<ConsensusEstimate> {
  console.debug('[ConsensusSelect] Selecting current quarter estimate');
  console.debug('[ConsensusSelect] Available estimates:', estimates.length);
  console.debug('[ConsensusSelect] Earnings snapshot:', earningsSnapshot);

  // Filter out full-year estimates
  const quarterlyEstimates = estimates.filter(
    (e) => !isFullYearEstimate(e) && (e.revenueEstimate !== undefined || e.epsEstimate !== undefined)
  );
  console.debug('[ConsensusSelect] Quarterly estimates after filter:', quarterlyEstimates.length);

  if (quarterlyEstimates.length === 0) {
    return {
      estimate: undefined,
      sourceNoteSuffix: undefined,
      reason: 'No valid quarterly estimates available',
    };
  }

  // Current period from snapshot
  const currentYear = earningsSnapshot?.fiscalYear;
  const currentQuarter = earningsSnapshot?.fiscalQuarter;
  const currentPeriodEnd = earningsSnapshot?.reportDate;

  const currentPeriod = parseQuarter(currentYear, currentQuarter);
  console.debug('[ConsensusSelect] Current period from snapshot:', { currentYear, currentQuarter, currentPeriod });

  // Priority 1: Exact fiscalYear + fiscalQuarter match
  if (currentPeriod) {
    const exactMatch = quarterlyEstimates.find((e) => {
      const ePeriod = parseQuarter(e.fiscalYear, e.fiscalQuarter);
      if (!ePeriod) return false;
      return (
        ePeriod.year === currentPeriod.year && ePeriod.quarter === currentPeriod.quarter
      );
    });

    if (exactMatch) {
      console.debug('[ConsensusSelect] Found exact match:', exactMatch);
      return {
        estimate: exactMatch,
        sourceNoteSuffix: undefined,
        reason: `Exact fiscal period match: ${exactMatch.fiscalYear} ${exactMatch.fiscalQuarter}`,
      };
    }
  }

  // Priority 2: Period end date close to current fiscal period
  if (currentPeriodEnd) {
    const currentDate = getDateValue(currentPeriodEnd);
    if (currentDate > 0) {
      let closestByPeriodEnd: ConsensusEstimate | undefined;
      let closestDiff = Infinity;

      for (const estimate of quarterlyEstimates) {
        const estDate = getDateValue(estimate.periodEndDate);
        if (estDate > 0) {
          const diff = Math.abs(estDate - currentDate);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestByPeriodEnd = estimate;
          }
        }
      }

      if (closestByPeriodEnd && closestDiff < 180 * 24 * 60 * 60 * 1000) {
        // Within ~6 months
        console.debug('[ConsensusSelect] Found close period end match:', closestByPeriodEnd);
        return {
          estimate: closestByPeriodEnd,
          sourceNoteSuffix: 'best_effort',
          reason: `Closest period end date (diff: ${Math.round(closestDiff / (24 * 60 * 60 * 1000))} days)`,
        };
      }
    }
  }

  // Priority 3: Report date close to current report date
  if (currentPeriodEnd) {
    const currentDate = getDateValue(currentPeriodEnd);
    if (currentDate > 0) {
      let closestByReportDate: ConsensusEstimate | undefined;
      let closestDiff = Infinity;

      for (const estimate of quarterlyEstimates) {
        const estDate = getDateValue(estimate.reportDate);
        if (estDate > 0) {
          const diff = Math.abs(estDate - currentDate);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestByReportDate = estimate;
          }
        }
      }

      if (closestByReportDate && closestDiff < 180 * 24 * 60 * 60 * 1000) {
        console.debug('[ConsensusSelect] Found close report date match:', closestByReportDate);
        return {
          estimate: closestByReportDate,
          sourceNoteSuffix: 'best_effort',
          reason: `Closest report date (diff: ${Math.round(closestDiff / (24 * 60 * 60 * 1000))} days)`,
        };
      }
    }
  }

  // Last resort: most recent quarterly estimate, with best_effort marker
  const sortedByRecency = sortByRecency(quarterlyEstimates);
  const mostRecent = sortedByRecency[0];

  if (mostRecent) {
    console.debug('[ConsensusSelect] Using most recent estimate (best effort):', mostRecent);
    return {
      estimate: mostRecent,
      sourceNoteSuffix: 'best_effort',
      reason: 'No matching period found, using most recent quarterly estimate',
    };
  }

  return {
    estimate: undefined,
    sourceNoteSuffix: undefined,
    reason: 'No suitable estimate found after all matching attempts',
  };
}

// Select next quarter revenue consensus estimate
export function selectNextQuarterRevenueConsensus(
  estimates: ConsensusEstimate[],
  earningsSnapshot?: EarningsSnapshotData
): SelectionResult<ConsensusEstimate> {
  console.debug('[ConsensusSelect] Selecting next quarter revenue estimate');

  // Filter out full-year estimates and those without revenue estimate
  const quarterlyEstimates = estimates.filter(
    (e) => !isFullYearEstimate(e) && e.revenueEstimate !== undefined
  );
  console.debug('[ConsensusSelect] Quarterly revenue estimates:', quarterlyEstimates.length);

  if (quarterlyEstimates.length === 0) {
    return {
      estimate: undefined,
      sourceNoteSuffix: undefined,
      reason: 'No valid quarterly revenue estimates available',
    };
  }

  // Current period from snapshot
  const currentYear = earningsSnapshot?.fiscalYear;
  const currentQuarter = earningsSnapshot?.fiscalQuarter;
  const currentPeriod = parseQuarter(currentYear, currentQuarter);

  console.debug('[ConsensusSelect] Current period for next quarter selection:', currentPeriod);

  if (currentPeriod) {
    // Find quarters after current
    const futureQuarters = quarterlyEstimates.filter((e) => {
      const ePeriod = parseQuarter(e.fiscalYear, e.fiscalQuarter);
      if (!ePeriod) return false;

      // Compare year + quarter
      if (ePeriod.year > currentPeriod.year) return true;
      if (ePeriod.year === currentPeriod.year && ePeriod.quarter > currentPeriod.quarter) return true;

      return false;
    });

    console.debug('[ConsensusSelect] Future quarters found:', futureQuarters.length);

    if (futureQuarters.length > 0) {
      // Find the earliest (next) quarter
      const sorted = [...futureQuarters].sort((a, b) => {
        const aPeriod = parseQuarter(a.fiscalYear, a.fiscalQuarter)!;
        const bPeriod = parseQuarter(b.fiscalYear, b.fiscalQuarter)!;

        if (aPeriod.year !== bPeriod.year) return aPeriod.year - bPeriod.year;
        return aPeriod.quarter - bPeriod.quarter;
      });

      const nextQuarter = sorted[0];
      console.debug('[ConsensusSelect] Found next quarter match:', nextQuarter);

      return {
        estimate: nextQuarter,
        sourceNoteSuffix: undefined,
        reason: `Next fiscal quarter after current period: ${nextQuarter.fiscalYear} ${nextQuarter.fiscalQuarter}`,
      };
    }
  }

  // No clear current period - just take the first quarterly estimate with revenue
  // but mark as best_effort
  const sortedByRecency = sortByRecency(quarterlyEstimates);
  const mostRecentWithRevenue = sortedByRecency[0];

  if (mostRecentWithRevenue) {
    console.debug('[ConsensusSelect] Using most recent revenue estimate (best effort):', mostRecentWithRevenue);
    return {
      estimate: mostRecentWithRevenue,
      sourceNoteSuffix: 'best_effort',
      reason: 'Could not determine next quarter, using most recent revenue estimate',
    };
  }

  return {
    estimate: undefined,
    sourceNoteSuffix: undefined,
    reason: 'No suitable next quarter revenue estimate found',
  };
}
