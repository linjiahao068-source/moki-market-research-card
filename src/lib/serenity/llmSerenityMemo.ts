import type { LLMResearchInput } from '@/types/evidence';
import { generateJson } from '@/lib/llm/client';
import { getLlmProviderConfig } from '@/lib/llm/config';
import { buildSerenitySkillsSystemPrompt, buildSerenitySkillsUserPrompt } from '@/lib/llm/prompts/serenitySkills';
import { parseSerenityMemoJson, validateSerenityMemoPayload } from '@/lib/llm/schemas/serenityMemo';
import { buildFallbackSerenityMemo } from './fallbackSerenityMemo';

function isTimeoutLike(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /abort|timeout|timed out|operation was aborted/i.test(error.message);
}

export async function generateSerenityMemo(input: LLMResearchInput) {
  const config = getLlmProviderConfig();
  const serenityConfig = {
    ...config,
    timeoutMs: Math.min(config.timeoutMs, 60000),
  };

  if (!serenityConfig.enabled) {
    return buildFallbackSerenityMemo({
      input,
      provider: serenityConfig.provider,
      model: serenityConfig.model,
      reason: serenityConfig.reason,
    });
  }

  const seedMemo = buildFallbackSerenityMemo({ input });
  const systemPrompt = buildSerenitySkillsSystemPrompt();
  const userPrompt = buildSerenitySkillsUserPrompt(input, seedMemo);

  try {
    const result = await generateJson({
      config: serenityConfig,
      maxTokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const payload = parseSerenityMemoJson(result.text);

    return validateSerenityMemoPayload({
      payload,
      input,
      provider: config.provider,
      model: result.model,
    });
  } catch (firstError) {
    if (isTimeoutLike(firstError)) {
      const reason = firstError instanceof Error ? firstError.message : 'Serenity memo generation timed out.';

      return buildFallbackSerenityMemo({
        input,
        provider: serenityConfig.provider,
        model: serenityConfig.model,
        reason,
      });
    }

    try {
      const repairResult = await generateJson({
        config: serenityConfig,
        temperature: 0,
        maxTokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          {
            role: 'user',
            content: [
              '上一轮输出未通过 schema 校验。',
              '请只返回修正后的 JSON 对象。',
              '所有用户可见字段必须使用简体中文；ticker、evidenceIds、calculationRefs、EPS、SEC/Yahoo/FMP、TAM-Adj-PEG、GF-DMA 可保留英文。',
              '每条 observations 都必须同时包含 payload 内存在的 evidenceIds 和 calculationRefs。',
              `Validation error: ${firstError instanceof Error ? firstError.message : 'unknown error'}`,
            ].join('\n'),
          },
        ],
      });
      const repairedPayload = parseSerenityMemoJson(repairResult.text);

      return validateSerenityMemoPayload({
        payload: repairedPayload,
        input,
        provider: serenityConfig.provider,
        model: repairResult.model,
        warnings: ['Serenity memo required one JSON repair attempt.'],
      });
    } catch (repairError) {
      const reason = repairError instanceof Error ? repairError.message : 'Serenity memo generation failed.';

      return buildFallbackSerenityMemo({
        input,
        provider: serenityConfig.provider,
        model: serenityConfig.model,
        reason,
      });
    }
  }
}
