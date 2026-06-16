/**
 * Serenity buy-side equity research memo 框架摘要
 *
 * 本文件仅沉淀 haskaomni/serenity-skill 中的研究框架规则，
 * 作为项目内部参考文档，不作为运行时 API 调用。
 *
 * 完整框架见：https://github.com/haskaomni/serenity-skill
 */

export const SERENITY_FRAMEWORK = {
  sourceName: 'Serenity buy-side-equity-research-memo',
  sourceRepo: 'https://github.com/haskaomni/serenity-skill',

  frameworkRules: [
    '必须包含 Bull / Base / Bear 三种情景',
    '每个情景包含 probability、core assumptions、target price、implied return',
    '必须区分 reported facts、management guidance、market consensus、analyst inference',
    '优先使用 SEC / IR / earnings call / investor presentation',
    '无法核验的数据标记为未核验'
  ]
} as const;

/**
 * 构建情景来源说明文本
 * 用于生成 research card 的 sourceNote 字段
 */
export function buildScenarioSourceNote(
  options: {
    includeSerenityReference?: boolean;
    customNote?: string;
    hasUnverifiedData?: boolean;
  } = {}
): string {
  const {
    includeSerenityReference = true,
    customNote,
    hasUnverifiedData = false
  } = options;

  const parts: string[] = [];

  parts.push('情景分析仅供研究辅助，不构成投资建议。');

  if (includeSerenityReference) {
    parts.push(`框架参考: ${SERENITY_FRAMEWORK.sourceName} (${SERENITY_FRAMEWORK.sourceRepo})`);
  }

  if (hasUnverifiedData) {
    parts.push('部分数据未核验，请结合权威来源复核。');
  }

  if (customNote) {
    parts.push(customNote);
  }

  return parts.join(' ');
}

/**
 * 情景数据来源优先级（按推荐顺序）
 */
export const SCENARIO_DATA_SOURCE_PRIORITY = [
  'SEC Filings (10-K, 10-Q, 8-K)',
  'Investor Relations (IR) official guidance',
  'Earnings call transcript',
  'Investor presentation',
  'Sell-side consensus (Bloomberg, FactSet)',
  'Market price (last close)',
  'Text extraction (unverified)',
  'Mock / placeholder'
] as const;
