import { SecurityInputKind } from '@/types/security';
import { detectSecurityInputKind } from './detectSecurityInputKind';

export interface NormalizedSecurityQuery {
  rawInput: string;
  trimmedInput: string;
  normalizedInput: string;
  inputKind: SecurityInputKind;
}

export function normalizeSecurityQuery(rawInput: string): NormalizedSecurityQuery {
  const trimmedInput = rawInput.trim();
  const normalized = trimmedInput.normalize('NFKC').trim();
  const inputKind = detectSecurityInputKind(normalized);

  return {
    rawInput,
    trimmedInput,
    normalizedInput: inputKind === 'symbol' ? normalized.toUpperCase() : normalized,
    inputKind,
  };
}
