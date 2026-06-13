import { mockSecurities } from '@/data/mockSecurities';
import { SecurityInputKind, SecurityRecord, SecurityResolution } from '@/types/security';
import { detectSecurityInputKind } from './detectSecurityInputKind';
import { normalizeSecurityQuery } from './normalizeSecurityQuery';

// V0.2.3 mock resolver: resolves user security input against a local mock security master.
// Later this pure resolver can be replaced by a real security master resolver without changing UI semantics.
export function resolveSecurityInput(rawInput: string): SecurityResolution {
  const { normalizedInput } = normalizeSecurityQuery(rawInput);
  const inputKind = detectSecurityInputKind(normalizedInput);

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
      fallbackSecurity: createFallbackSecurity({ inputKind, normalizedInput }),
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
      fallbackSecurity: createFallbackSecurity({ inputKind, normalizedInput }),
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
      fallbackSecurity: createFallbackSecurity({ inputKind, normalizedInput }),
    });
  }

  return {
    status: 'unmatched',
    inputKind,
    rawInput,
    normalizedInput,
    fallbackSecurity: createFallbackSecurity({ inputKind, normalizedInput: normalizedInput || rawInput }),
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
  normalizedInput,
}: {
  inputKind: SecurityInputKind;
  normalizedInput: string;
}): SecurityRecord {
  const fallbackName = normalizedInput || 'Unknown Security';

  return {
    id: `unknown-${fallbackName.toLowerCase()}`,
    market: 'UNKNOWN',
    symbol: inputKind === 'symbol' ? normalizedInput : undefined,
    numericCode: inputKind === 'numericCode' ? normalizedInput : undefined,
    companyName: inputKind === 'chineseName' ? fallbackName : `${fallbackName} Company`,
    chineseNameHK: inputKind === 'chineseName' ? fallbackName : undefined,
    theme: 'general market research context',
  };
}
