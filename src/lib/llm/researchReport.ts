import type { ResearchCard } from '@/types/research-card';
import type {
  ResearchReport,
  ResearchReportGenerationState,
} from '@/types/research-report';
import { buildEvidenceReferenceLayer } from '@/lib/research-report/evidenceReferenceLayer';
import { generateBuySideReport } from '@/lib/research-report/buySideReportGenerator';
import { buildIntegratedResearchReport } from '@/lib/research-report/integratedReportBuilder';
import { buildResearchReportFromCard } from '@/lib/research-report/fromResearchCard';
import { buildTechnicalDashboardFromAdapter } from '@/lib/research-report/technicalDataAdapter';
import { generateJson } from './client';
import { getLlmProviderConfig } from './config';
import { buildResearchReportSystemPrompt, buildResearchReportUserPrompt } from './prompts/researchReport';
import type { ResearchReportPayload } from './schemas/researchReport';
import {
  parseResearchReportJson,
  validateResearchReportPayload,
} from './schemas/researchReport';

function isTimeoutLike(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /abort|timeout|timed out|operation was aborted/i.test(error.message);
}

function fallbackReport(
  seed: ResearchReport,
  generationState: ResearchReportGenerationState
): ResearchReport {
  return {
    ...seed,
    updatedAt: generationState.generatedAt,
    generationState,
  };
}

function rebuildReportFromPayload({
  seed,
  payload,
  generationState,
}: {
  seed: ResearchReport;
  payload: ResearchReportPayload;
  generationState: ResearchReportGenerationState;
}): ResearchReport {
  const reportBase: Omit<ResearchReport, 'evidenceLayer' | 'buySideReport' | 'technicalDashboard' | 'integratedReport'> = {
    ...seed,
    status: seed.status === 'fallback' ? 'fallback' : 'generated',
    title: payload.title,
    subtitle: payload.subtitle,
    executiveSummary: payload.executiveSummary,
    sections: payload.sections,
    followUpResearch: payload.followUpResearch,
    disclaimer: payload.disclaimer,
    updatedAt: generationState.generatedAt,
    generationState,
  };

  const reportWithEvidenceLayer: Omit<ResearchReport, 'buySideReport' | 'technicalDashboard' | 'integratedReport'> = {
    ...reportBase,
    evidenceLayer: buildEvidenceReferenceLayer(reportBase),
  };

  const reportWithBuySide: Omit<ResearchReport, 'technicalDashboard' | 'integratedReport'> = {
    ...reportWithEvidenceLayer,
    buySideReport: generateBuySideReport(reportWithEvidenceLayer),
  };

  const reportWithTechnical: Omit<ResearchReport, 'integratedReport'> = {
    ...reportWithBuySide,
    technicalDashboard: buildTechnicalDashboardFromAdapter(reportWithBuySide),
  };

  return {
    ...reportWithTechnical,
    integratedReport: buildIntegratedResearchReport(reportWithTechnical),
  };
}

function disabledGenerationState({
  provider,
  model,
  reason,
}: {
  provider: string;
  model?: string;
  reason?: string;
}): ResearchReportGenerationState {
  return {
    method: 'legacy_adapter_fallback',
    generatedAt: new Date().toISOString(),
    provider,
    model,
    nativeJson: false,
    fallbackUsed: true,
    warnings: [reason ?? 'Native ResearchReport generation is not configured; legacy adapter fallback was used.'],
  };
}

function failedGenerationState({
  provider,
  model,
  reason,
}: {
  provider: string;
  model?: string;
  reason: string;
}): ResearchReportGenerationState {
  return {
    method: 'legacy_adapter_fallback',
    generatedAt: new Date().toISOString(),
    provider,
    model,
    nativeJson: false,
    fallbackUsed: true,
    warnings: [`Native ResearchReport generation failed; legacy adapter fallback was used. ${reason}`],
  };
}

export async function generateResearchReportFromCard(card: ResearchCard): Promise<ResearchReport> {
  const seed = buildResearchReportFromCard(card);
  const config = getLlmProviderConfig();

  if (!config.enabled) {
    return fallbackReport(seed, disabledGenerationState({
      provider: config.provider,
      model: config.model,
      reason: config.reason,
    }));
  }

  const systemPrompt = buildResearchReportSystemPrompt();
  const userPrompt = buildResearchReportUserPrompt(seed);

  try {
    const result = await generateJson({
      config,
      maxTokens: 4500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const payload = validateResearchReportPayload(parseResearchReportJson(result.text), seed);

    return rebuildReportFromPayload({
      seed,
      payload,
      generationState: {
        method: 'llm_research_report_json',
        generatedAt: new Date().toISOString(),
        provider: config.provider,
        model: result.model,
        nativeJson: true,
        fallbackUsed: false,
        warnings: [],
      },
    });
  } catch (firstError) {
    if (isTimeoutLike(firstError)) {
      return fallbackReport(seed, failedGenerationState({
        provider: config.provider,
        model: config.model,
        reason: firstError instanceof Error ? firstError.message : 'LLM request timed out.',
      }));
    }

    try {
      const repairResult = await generateJson({
        config,
        temperature: 0,
        maxTokens: 4200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          {
            role: 'user',
            content: [
              'The previous response did not pass ResearchReport JSON validation.',
              'Return only a corrected JSON object with the requested top-level keys.',
              'Do not add confidence, data quality scores, target prices, ratings, or unsupported facts.',
              `Validation error: ${firstError instanceof Error ? firstError.message : 'unknown error'}`,
            ].join('\n'),
          },
        ],
      });
      const repairedPayload = validateResearchReportPayload(parseResearchReportJson(repairResult.text), seed);

      return rebuildReportFromPayload({
        seed,
        payload: repairedPayload,
        generationState: {
          method: 'llm_research_report_json',
          generatedAt: new Date().toISOString(),
          provider: config.provider,
          model: repairResult.model,
          nativeJson: true,
          fallbackUsed: false,
          warnings: ['ResearchReport required one JSON repair attempt.'],
        },
      });
    } catch (repairError) {
      return fallbackReport(seed, failedGenerationState({
        provider: config.provider,
        model: config.model,
        reason: repairError instanceof Error ? repairError.message : 'LLM response could not be repaired.',
      }));
    }
  }
}
