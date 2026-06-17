import type { ResearchBrief } from '@/types/research-brief';

function replaceCommonEnglish(text: string) {
  return text
    .replace(/\bEarnings\s*&\s*Guidance\s*Brief\b/gi, '财报与指引摘要')
    .replace(/\bEarnings\s+and\s+Guidance\s+Brief\b/gi, '财报与指引摘要')
    .replace(/\bResearch\s+Brief\b/gi, '研究摘要')
    .replace(/\bevidence-backed research brief\b/gi, '证据驱动研究摘要')
    .replace(/\bdeterministic fallback\b/gi, '确定性回退逻辑')
    .replace(/\bfacts\/evidence\b/gi, '事实与证据')
    .replace(/\breported facts\b/gi, '已披露事实')
    .replace(/\breported fact\b/gi, '已披露事实')
    .replace(/\bmanagement guidance\b/gi, '管理层指引')
    .replace(/\bscenario output\b/gi, '情景输出')
    .replace(/\bfinancial_metric facts\b/gi, '财务指标事实')
    .replace(/\bguidance_metric facts\b/gi, '指引指标事实')
    .replace(/\bscenario facts\b/gi, '情景推演事实')
    .replace(/\bRevenue actual\b/gi, '实际收入')
    .replace(/\bRevenue consensus\b/gi, '收入市场共识')
    .replace(/\bRevenue YoY\b/gi, '收入同比')
    .replace(/\bEPS actual\b/gi, '实际 EPS')
    .replace(/\bEPS consensus\b/gi, 'EPS 市场共识')
    .replace(/\bEPS YoY\b/gi, 'EPS 同比')
    .replace(/\bNet income actual\b/gi, '实际净利润')
    .replace(/\bNet income YoY\b/gi, '净利润同比')
    .replace(/\bCurrent price\b/gi, '当前价格')
    .replace(/\bnot available\b/gi, '暂无数据')
    .replace(/\bCompany\b/g, '公司');
}

function localizeWarning(text: string) {
  return replaceCommonEnglish(text)
    .replace(/FMP earnings estimates unavailable: FMP_API_KEY is not configured\./gi, 'FMP 盈利预期不可用：未配置 FMP_API_KEY。')
    .replace(/Yahoo quoteSummary earnings data unavailable\./gi, 'Yahoo quoteSummary 财报数据不可用。')
    .replace(/Revenue was not used because evidence is missing, not duration, or does not match latest filing reportDate\./gi, '收入未被采用：缺少证据、不是期间数据，或与最新 filing 报告日不匹配。')
    .replace(/Net income was not used because evidence is missing, not duration, or does not match latest filing reportDate\./gi, '净利润未被采用：缺少证据、不是期间数据，或与最新 filing 报告日不匹配。')
    .replace(/Diluted EPS was not used because evidence is missing, not duration, or does not match latest filing reportDate\./gi, '摊薄 EPS 未被采用：缺少证据、不是期间数据，或与最新 filing 报告日不匹配。')
    .replace(/Revenue could not be parsed as a numeric value\./gi, '收入无法解析为数值。')
    .replace(/Net income could not be parsed as a numeric value\./gi, '净利润无法解析为数值。')
    .replace(/Diluted EPS could not be parsed as a numeric value\./gi, '摊薄 EPS 无法解析为数值。')
    .replace(/Prior-year same-quarter SEC fact selection is not implemented yet; YoY values are intentionally left blank\./gi, '暂未实现 SEC 去年同期单季事实选择，因此同比值有意留空。')
    .replace(/Eastmoney income statement diluted EPS field was not found\./gi, '东方财富利润表未找到摊薄 EPS 字段。')
    .replace(/Eastmoney GMAININDICATOR may be annual, cumulative, or TTM; do not treat EPS as single-quarter EPS without source review\./gi, '东方财富 GMAININDICATOR 可能是年度、累计或 TTM 数据，未经来源复核不要当作单季 EPS。')
    .replace(/Guidance evidence is merged by the enhanced earnings API when available\./gi, '如有可用数据，增强财报 API 会合并公司指引证据。')
    .replace(/SEC exhibit guidance extracted from ([0-9]+) text block\(s\)\./gi, '已从 SEC 附件中抽取 $1 个指引文本块。')
    .replace(/FMP_API_KEY is not configured; FMP guidance lookup was skipped\./gi, '未配置 FMP_API_KEY，已跳过 FMP 指引查询。')
    .replace(/Yahoo search did not return guidance-related news evidence\./gi, 'Yahoo 搜索未返回与指引相关的新闻证据。')
    .replace(/Yahoo guidance-related news evidence was not found for this symbol\./gi, '未找到该标的的 Yahoo 指引相关新闻证据。')
    .replace(/Fallback brief has no evidence-backed claims\./gi, '回退摘要没有可由证据支持的结论。')
    .replace(/Research brief required one JSON repair attempt\./gi, '模型输出经过一次 JSON 修复。')
    .replace(/Unterminated string in JSON.*/gi, '模型返回的 JSON 字符串不完整，已回退到可追溯摘要。')
    .replace(/LLM request timed out after ([0-9]+)ms\./gi, 'LLM 请求在 $1 毫秒后超时。')
    .replace(/This operation was aborted/gi, 'LLM 请求已中止。');
}

function hasChinese(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function localizeHeadline(headline: string, ticker?: string) {
  const localized = replaceCommonEnglish(headline).trim();

  if (hasChinese(localized)) {
    return localized;
  }

  const prefix = ticker ? `${ticker} ` : '';

  if (/earnings|guidance/i.test(headline)) {
    return `${prefix}财报与指引摘要`;
  }

  return `${prefix}研究摘要`;
}

export function optimizeResearchBriefChinese(brief: ResearchBrief): ResearchBrief {
  return {
    ...brief,
    headline: localizeHeadline(brief.headline, brief.ticker),
    executiveSummary: replaceCommonEnglish(brief.executiveSummary),
    modules: brief.modules.map((module) => ({
      ...module,
      title: replaceCommonEnglish(module.title),
      summary: replaceCommonEnglish(module.summary),
      claims: module.claims.map((claim) => ({
        ...claim,
        title: replaceCommonEnglish(claim.title),
        body: replaceCommonEnglish(claim.body),
      })),
      missingData: module.missingData.map((item) => replaceCommonEnglish(item)),
    })),
    uncertainties: brief.uncertainties.map((item) => localizeWarning(item)),
    warnings: brief.warnings.map((item) => localizeWarning(item)),
  };
}
