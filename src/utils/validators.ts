export const isMongoObjectId = (value?: string): boolean => !!value && /^[a-fA-F0-9]{24}$/.test(value);

const MAX_PASSWORD_LENGTH = 128;
const MALICIOUS_PASSWORD_PATTERNS = [/<|>/, /\bscript\b/i, /javascript:/i, /\0/];

/**
 * Check for malicious input in password fields (XSS-style, etc.).
 * Max length 128; reject <>, script, javascript:, null bytes.
 */
export function isMaliciousPassword(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const s = value.trim();
  if (s.length > MAX_PASSWORD_LENGTH) return true;
  return MALICIOUS_PASSWORD_PATTERNS.some((re) => re.test(s));
}
