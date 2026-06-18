import type {
  ResearchReport,
  ResearchReportEvidenceLayer,
  ResearchReportEvidenceLayerSummary,
  ResearchReportEvidenceLink,
  ResearchReportEvidenceLinkStatus,
  ResearchReportEvidenceReference,
  ResearchReportEvidenceRelation,
  ResearchReportFactReference,
  ResearchReportMissingReference,
  ResearchReportReferenceTarget,
  ResearchReportSection,
} from '@/types/research-report';

type EvidenceLayerInput = Pick<
  ResearchReport,
  'sections' | 'evidenceReferences' | 'factReferences' | 'followUpResearch'
>;

interface TargetWithRefs {
  target: ResearchReportReferenceTarget;
  evidenceIds: string[];
  factIds: string[];
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function evidenceWarnings(evidence: ResearchReportEvidenceReference) {
  const warnings = [...evidence.warnings];

  if (evidence.evidenceWeight === 'fallback') {
    warnings.push('Fallback source; verify before relying on this claim.');
  }

  if (evidence.sourceQuality === 'fallback' || evidence.sourceQuality === 'unknown') {
    warnings.push('Source quality needs review.');
  }

  if (!evidence.snippet) {
    warnings.push('Source snippet is missing.');
  }

  return unique(warnings);
}

function evidenceStatus(evidence: ResearchReportEvidenceReference): ResearchReportEvidenceLinkStatus {
  const warnings = evidenceWarnings(evidence);

  if (evidence.evidenceWeight === 'fallback' || evidence.sourceQuality === 'fallback') {
    return 'fallback_source';
  }

  if (warnings.length > 0) {
    return 'needs_review';
  }

  return 'linked';
}

function evidenceRelation(evidence: ResearchReportEvidenceReference): ResearchReportEvidenceRelation {
  if (evidence.evidenceWeight === 'fallback') {
    return 'requires_review';
  }

  if (evidence.evidenceWeight === 'context') {
    return 'context';
  }

  return 'supports';
}

function factEvidenceIds(factIds: string[], factById: Map<string, ResearchReportFactReference>) {
  return factIds.flatMap((factId) => factById.get(factId)?.evidenceIds ?? []);
}

function collectTargets(sections: ResearchReportSection[], followUpResearch: EvidenceLayerInput['followUpResearch']) {
  const targets: TargetWithRefs[] = [];

  sections.forEach((section) => {
    section.claims.forEach((claim) => {
      targets.push({
        target: {
          kind: 'claim',
          sectionId: section.id,
          id: claim.id,
          label: claim.title,
        },
        evidenceIds: claim.evidenceIds,
        factIds: claim.factIds,
      });
    });

    section.metrics.forEach((metric) => {
      targets.push({
        target: {
          kind: 'metric',
          sectionId: section.id,
          id: metric.id,
          label: metric.label,
        },
        evidenceIds: metric.evidenceIds,
        factIds: metric.factIds,
      });
    });

    section.items.forEach((item) => {
      targets.push({
        target: {
          kind: 'section_item',
          sectionId: section.id,
          id: item.id,
          label: item.title,
        },
        evidenceIds: item.evidenceIds,
        factIds: item.factIds,
      });
    });
  });

  followUpResearch.forEach((task) => {
    targets.push({
      target: {
        kind: 'follow_up_task',
        id: task.id,
        label: task.task,
      },
      evidenceIds: task.evidenceIds,
      factIds: task.factIds,
    });
  });

  return targets;
}

function missingReference(target: ResearchReportReferenceTarget, reason: string, factIds: string[]): ResearchReportMissingReference {
  return {
    id: `missing-${target.kind}-${target.id}`,
    target,
    reason,
    severity: target.kind === 'claim' ? 'warning' : 'info',
    factIds,
  };
}

export function buildEvidenceReferenceLayer(input: EvidenceLayerInput): ResearchReportEvidenceLayer {
  const evidenceById = indexById(input.evidenceReferences);
  const factById = indexById(input.factReferences);
  const targets = collectTargets(input.sections, input.followUpResearch);
  const links: ResearchReportEvidenceLink[] = [];
  const missingReferences: ResearchReportMissingReference[] = [];

  targets.forEach(({ target, evidenceIds, factIds }) => {
    const resolvedEvidenceIds = unique([
      ...evidenceIds,
      ...factEvidenceIds(factIds, factById),
    ]);

    if (resolvedEvidenceIds.length === 0) {
      missingReferences.push(missingReference(target, 'No evidence or fact reference is attached to this target.', factIds));
      return;
    }

    resolvedEvidenceIds.forEach((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);

      if (!evidence) {
        missingReferences.push(missingReference(target, `Evidence reference ${evidenceId} is not present in evidenceReferences.`, factIds));
        return;
      }

      const warnings = evidenceWarnings(evidence);
      links.push({
        id: `link-${target.kind}-${target.id}-${evidence.id}`,
        evidenceId: evidence.id,
        factIds,
        target,
        relation: evidenceRelation(evidence),
        status: evidenceStatus(evidence),
        note: warnings.length > 0 ? warnings[0] : 'Evidence reference is linked to this report target.',
        warnings,
      });
    });
  });

  const linkedTargetCount = new Set(links.map((link) => `${link.target.kind}:${link.target.id}`)).size;
  const warningCount = links.reduce((count, link) => count + link.warnings.length, 0) + missingReferences.length;
  const summary: ResearchReportEvidenceLayerSummary = {
    evidenceReferenceCount: input.evidenceReferences.length,
    factReferenceCount: input.factReferences.length,
    linkedTargetCount,
    missingReferenceCount: missingReferences.length,
    fallbackEvidenceCount: input.evidenceReferences.filter((evidence) => evidence.evidenceWeight === 'fallback').length,
    warningCount,
  };

  return {
    summary,
    links,
    missingReferences,
  };
}
