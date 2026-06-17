import { mockSecurities } from '@/data/mockSecurities';
import { SecurityInputKind, SecurityRecord, SecurityResolution } from '@/types/security';
import { normalizeSecurityQuery } from './normalizeSecurityQuery';

// Resolves user input against the local securities master fallback.
// Later this pure resolver can be replaced by a real securities master data resolver.
export function resolveSecurityInput(rawInput: string): SecurityResolution {
  const { normalizedInput, inputKind } = normalizeSecurityQuery(rawInput);

  if (inputKind === 'symbol') {
    const matches = mockSecurities.filter(
      (security) => security.symbol?.toUpperCase() === normalizedInput.toUpperCase()
    );

    return resolveMatches({
      matches,
      inputKind,
      matchType: 'symbol',
      rawInput,
      normalizedInput,
      fallbackSecurity: createFallbackSecurity({ inputKind, rawInput, normalizedInput }),
    });
  }

  if (inputKind === 'numericCode') {
    const matches = mockSecurities.filter(
      (security) =>
        security.numericCode === normalizedInput ||
        security.codeVariants?.some((variant) => variant === normalizedInput)
    );

    return resolveMatches({
      matches,
      inputKind,
      matchType: 'numericCode',
      rawInput,
      normalizedInput,
      fallbackSecurity: createFallbackSecurity({ inputKind, rawInput, normalizedInput }),
    });
  }

  if (inputKind === 'chineseName') {
    const matches = mockSecurities.filter(
      (security) =>
        security.chineseNameHK === normalizedInput ||
        security.chineseAliases?.some((alias) => alias === normalizedInput)
    );

    return resolveMatches({
      matches,
      inputKind,
      matchType: 'chineseName',
      rawInput,
      normalizedInput,
      fallbackSecurity: createFallbackSecurity({ inputKind, rawInput, normalizedInput }),
    });
  }

  return {
    status: 'unmatched',
    inputKind,
    rawInput,
    normalizedInput,
    fallbackSecurity: createFallbackSecurity({ inputKind, rawInput, normalizedInput }),
  };
}

function resolveMatches({
  matches,
  inputKind,
  matchType,
  rawInput,
  normalizedInput,
  fallbackSecurity,
}: {
  matches: SecurityRecord[];
  inputKind: SecurityInputKind;
  matchType: 'symbol' | 'numericCode' | 'chineseName';
  rawInput: string;
  normalizedInput: string;
  fallbackSecurity: SecurityRecord;
}): SecurityResolution {
  if (matches.length === 1) {
    return {
      status: 'matched',
      inputKind,
      matchType,
      rawInput,
      normalizedInput,
      security: matches[0],
    };
  }

  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      inputKind,
      rawInput,
      normalizedInput,
      candidates: matches,
    };
  }

  return {
    status: 'unmatched',
    inputKind,
    rawInput,
    normalizedInput,
    fallbackSecurity,
  };
}

function createFallbackSecurity({
  inputKind,
  rawInput,
  normalizedInput,
}: {
  inputKind: SecurityInputKind;
  rawInput: string;
  normalizedInput: string;
}): SecurityRecord {
  const fallbackName = normalizedInput || rawInput || 'Unknown Company';

  return {
    id: `unknown-${normalizedInput}`,
    market: 'UNKNOWN',
    symbol: inputKind === 'symbol' ? normalizedInput : undefined,
    numericCode: inputKind === 'numericCode' ? normalizedInput : undefined,
    companyName: fallbackName,
    chineseNameHK: inputKind === 'chineseName' ? normalizedInput : undefined,
    theme: 'General market research placeholder',
  };
}
