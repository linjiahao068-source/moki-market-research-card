import type { LLMResearchInput } from '@/types/evidence';
import { optimizeResearchBriefChinese } from './chineseResearchBrief';
import { generateJson } from './client';
import { getLlmProviderConfig } from './config';
import { buildFallbackResearchBrief } from './fallbackResearchBrief';
import { buildResearchBriefSystemPrompt, buildResearchBriefUserPrompt } from './prompts/researchBrief';
import { parseResearchBriefJson, validateResearchBriefPayload } from './schemas/researchBrief';

function isTimeoutLike(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /abort|timeout|timed out|operation was aborted/i.test(error.message);
}

export async function generateResearchBrief(input: LLMResearchInput) {
  const config = getLlmProviderConfig();

  if (!config.enabled) {
    return optimizeResearchBriefChinese(
      buildFallbackResearchBrief({
        input,
        provider: config.provider,
        model: config.model,
        reason: config.reason,
      })
    );
  }

  const seedBrief = optimizeResearchBriefChinese(buildFallbackResearchBrief({ input }));
  const systemPrompt = buildResearchBriefSystemPrompt();
  const userPrompt = buildResearchBriefUserPrompt(input, seedBrief);

  try {
    const result = await generateJson({
      config,
      maxTokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const payload = parseResearchBriefJson(result.text);

    return optimizeResearchBriefChinese(
      validateResearchBriefPayload({
        payload,
        input,
        provider: config.provider,
        model: result.model,
      })
    );
  } catch (firstError) {
    if (isTimeoutLike(firstError)) {
      const reason = firstError instanceof Error ? firstError.message : 'LLM research brief generation timed out.';

      return optimizeResearchBriefChinese(
        buildFallbackResearchBrief({
          input,
          provider: config.provider,
          model: config.model,
          reason,
        })
      );
    }

    try {
      const repairResult = await generateJson({
        config,
        temperature: 0,
        maxTokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          {
            role: 'user',
            content: [
              '上一次回复没有通过校验。',
              '请只返回修正后的 JSON 对象。',
              '所有用户可见字段必须使用简体中文；ticker、evidenceIds、EPS、SEC/Yahoo/FMP 等专有名词可以保留英文。',
              `Validation error: ${firstError instanceof Error ? firstError.message : 'unknown error'}`,
            ].join('\n'),
          },
        ],
      });
      const repairedPayload = parseResearchBriefJson(repairResult.text);

      return optimizeResearchBriefChinese(
        validateResearchBriefPayload({
          payload: repairedPayload,
          input,
          provider: config.provider,
          model: repairResult.model,
          warnings: ['Research brief required one JSON repair attempt.'],
        })
      );
    } catch (repairError) {
      const reason = repairError instanceof Error ? repairError.message : 'LLM research brief generation failed.';

      return optimizeResearchBriefChinese(
        buildFallbackResearchBrief({
          input,
          provider: config.provider,
          model: config.model,
          reason,
        })
      );
    }
  }
}
