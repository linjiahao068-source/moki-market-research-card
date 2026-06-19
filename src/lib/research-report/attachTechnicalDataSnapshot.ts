import type { ResearchReport, TechnicalDataSnapshot } from '@/types/research-report';
import { buildIntegratedResearchReport } from './integratedReportBuilder';
import { buildTechnicalDashboardFromAdapter } from './technicalDataAdapter';

export function attachTechnicalDataSnapshotToReport(
  report: ResearchReport,
  snapshot: TechnicalDataSnapshot
): ResearchReport {
  const reportWithSnapshot: ResearchReport = {
    ...report,
    updatedAt: snapshot.generatedAt,
    technicalDataSnapshot: snapshot,
  };
  const reportWithTechnical: Omit<ResearchReport, 'integratedReport'> = {
    ...reportWithSnapshot,
    technicalDashboard: buildTechnicalDashboardFromAdapter(reportWithSnapshot),
  };

  return {
    ...reportWithTechnical,
    integratedReport: buildIntegratedResearchReport(reportWithTechnical),
  };
}
