import type { ResearchBriefProvider } from '@/types/research-brief';

export interface LlmProviderConfig {
  provider: ResearchBriefProvider;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs: number;
  jsonMode: boolean;
  reason?: string;
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readProvider(): ResearchBriefProvider {
  const provider = readEnv('LLM_PROVIDER')?.toLowerCase();

  if (provider === 'ark' || provider === 'volcengine' || provider === 'volcengine-ark') {
    return 'ark';
  }

  if (provider === 'deepseek') {
    return 'deepseek';
  }

  if (provider === 'openai-compatible' || provider === 'compatible') {
    return 'openai-compatible';
  }

  if (provider === 'fallback') {
    return 'fallback';
  }

  return 'disabled';
}

function readTimeoutMs() {
  const raw = readEnv('LLM_TIMEOUT_MS');
  const parsed = raw ? Number(raw) : 30000;

  if (!Number.isFinite(parsed) || parsed < 1000) {
    return 30000;
  }

  return Math.min(parsed, 120000);
}

function isGenerationEnabled(provider: ResearchBriefProvider) {
  const flag = readEnv('RESEARCH_GENERATION_ENABLED');

  if (flag === undefined) {
    return provider !== 'disabled' && provider !== 'fallback';
  }

  return flag.toLowerCase() === 'true';
}

function providerCredentials(provider: ResearchBriefProvider) {
  if (provider === 'ark') {
    return {
      apiKey: readEnv('ARK_API_KEY') ?? readEnv('VOLCENGINE_ARK_API_KEY'),
      baseUrl: readEnv('ARK_BASE_URL') ?? readEnv('VOLCENGINE_ARK_BASE_URL') ?? 'https://ark.cn-beijing.volces.com/api/v3',
      model: readEnv('ARK_MODEL') ?? readEnv('ARK_MODEL_ID') ?? readEnv('VOLCENGINE_ARK_MODEL'),
    };
  }

  if (provider === 'deepseek') {
    return {
      apiKey: readEnv('DEEPSEEK_API_KEY'),
      baseUrl: readEnv('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com',
      model: readEnv('DEEPSEEK_MODEL'),
    };
  }

  if (provider === 'openai-compatible') {
    return {
      apiKey: readEnv('OPENAI_COMPATIBLE_API_KEY'),
      baseUrl: readEnv('OPENAI_COMPATIBLE_BASE_URL'),
      model: readEnv('OPENAI_COMPATIBLE_MODEL'),
    };
  }

  return {};
}

export function getLlmProviderConfig(): LlmProviderConfig {
  const provider = readProvider();
  const enabled = isGenerationEnabled(provider);
  const { apiKey, baseUrl, model } = providerCredentials(provider);
  const jsonMode = readEnv('LLM_JSON_MODE')?.toLowerCase() === 'true';

  if (!enabled || provider === 'disabled' || provider === 'fallback') {
    return {
      provider,
      enabled: false,
      timeoutMs: readTimeoutMs(),
      jsonMode,
      reason: provider === 'fallback' ? 'LLM_PROVIDER=fallback.' : 'LLM generation is disabled.',
    };
  }

  if (!apiKey) {
    return {
      provider,
      enabled: false,
      baseUrl,
      model,
      timeoutMs: readTimeoutMs(),
      jsonMode,
      reason: `${provider} API key is not configured.`,
    };
  }

  if (!baseUrl || !model) {
    return {
      provider,
      enabled: false,
      apiKey,
      baseUrl,
      model,
      timeoutMs: readTimeoutMs(),
      jsonMode,
      reason: `${provider} baseUrl or model is not configured.`,
    };
  }

  return {
    provider,
    enabled: true,
    apiKey,
    baseUrl,
    model,
    timeoutMs: readTimeoutMs(),
    jsonMode,
  };
}
