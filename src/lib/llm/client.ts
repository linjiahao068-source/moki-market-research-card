import type { LlmProviderConfig } from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateJsonInput {
  config: LlmProviderConfig;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateJsonResult {
  text: string;
  model?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
  error?: {
    message?: string;
  };
}

function buildChatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, '');

  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

export async function generateJson({ config, messages, temperature = 0.2, maxTokens = 1800 }: GenerateJsonInput): Promise<GenerateJsonResult> {
  if (!config.enabled || !config.apiKey || !config.baseUrl || !config.model) {
    throw new Error(config.reason ?? 'LLM provider is not configured.');
  }

  const controller = new AbortController();
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  if (config.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`LLM request timed out after ${config.timeoutMs}ms.`));
    }, config.timeoutMs);
  });
  const requestPromise = fetch(buildChatCompletionsUrl(config.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  try {
    const response = await Promise.race([requestPromise, timeoutPromise]);
    const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? `LLM request failed with status ${response.status}.`);
    }

    const text = payload?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('LLM response did not include message content.');
    }

    return {
      text,
      model: payload?.model ?? config.model,
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
