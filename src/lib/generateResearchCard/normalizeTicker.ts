// Legacy helper: normalizeTicker is only for old English ticker validation.
// V0.2.3 security input flows should use resolveSecurityInput instead.
export type NormalizeTickerResult =
  | {
      ok: true;
      ticker: string;
    }
  | {
      ok: false;
      error: string;
    };

export function normalizeTicker(input: string): NormalizeTickerResult {
  const ticker = input.trim().toUpperCase();

  if (!ticker) {
    return {
      ok: false,
      error: '请输入股票代码。',
    };
  }

  if (!/^[A-Z.]{1,8}$/.test(ticker)) {
    return {
      ok: false,
      error: '股票代码格式不正确。',
    };
  }

  return {
    ok: true,
    ticker,
  };
}
