import { detectSecurityInputKind } from './detectSecurityInputKind';

export interface NormalizedSecurityQuery {
  rawInput: string;
  trimmedInput: string;
  normalizedInput: string;
}

export function normalizeSecurityQuery(rawInput: string): NormalizedSecurityQuery {
  const trimmedInput = rawInput.trim();
  const inputKind = detectSecurityInputKind(trimmedInput);
  const normalized = rawInput.normalize('NFKC').trim();

  return {
    rawInput,
    trimmedInput,
    normalizedInput: inputKind === 'symbol' ? normalized.toUpperCase() : normalized,
  };
}
