import type { EvidenceRecord } from '@/types/evidence';
import { createStableId, uniqueById } from './factValidation';

type EvidenceDraft = Omit<EvidenceRecord, 'id' | 'warnings'> & {
  id?: string;
  warnings?: string[];
};

export function createEvidenceId(prefix: string, draft: Pick<EvidenceDraft, 'ticker' | 'source' | 'sourceUrl' | 'textBlockId' | 'sourceLabel'>) {
  return createStableId([
    prefix,
    draft.ticker,
    draft.source,
    draft.textBlockId,
    draft.sourceUrl,
    draft.sourceLabel,
  ]);
}

export class EvidenceCollector {
  private records: EvidenceRecord[] = [];

  add(prefix: string, draft: EvidenceDraft) {
    const record: EvidenceRecord = {
      ...draft,
      id: draft.id ?? createEvidenceId(prefix, draft),
      warnings: draft.warnings ?? [],
    };

    this.records.push(record);
    return record.id;
  }

  addMany(prefix: string, drafts: EvidenceDraft[]) {
    return drafts.map((draft) => this.add(prefix, draft));
  }

  list() {
    this.records = uniqueById(this.records);
    return this.records;
  }

  idsForUrl(url?: string) {
    if (!url) {
      return [];
    }

    return this.list()
      .filter((record) => record.sourceUrl === url)
      .map((record) => record.id);
  }

  firstIdForSource(source: string) {
    return this.list().find((record) => record.source === source)?.id;
  }
}
