import { Evidence } from '@/types/research-card';

interface EvidenceItemProps {
  evidence: Evidence;
}

export function EvidenceItem({ evidence }: EvidenceItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-medium text-gray-900">{evidence.sourceLabel}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {evidence.sourceType}
        </span>
        <span className="text-xs text-gray-400">{evidence.timestamp}</span>
        <span className="text-xs text-gray-500 ml-auto">
          置信度：{(evidence.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-gray-700 text-sm">{evidence.summary}</p>
    </div>
  );
}
