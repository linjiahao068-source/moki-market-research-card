import { SecurityInputKind } from '@/types/security';

export function detectSecurityInputKind(rawInput: string): SecurityInputKind {
  const input = rawInput.trim();

  if (!input) {
    return 'unknown';
  }

  if (/^\d+$/.test(input)) {
    return 'numericCode';
  }

  if (/\p{Script=Han}/u.test(input)) {
    return 'chineseName';
  }

  if (/^[A-Za-z0-9.-]+$/.test(input)) {
    return 'symbol';
  }

  return 'unknown';
}
