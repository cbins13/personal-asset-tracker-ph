export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '');
}

export function sanitizeObjectStrings(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? sanitizeText(item) : sanitizeObjectStrings(item)));
  }
  return Object.entries(value).reduce((acc, [key, val]) => {
    if (typeof val === 'string') {
      acc[key] = sanitizeText(val);
    } else {
      acc[key] = sanitizeObjectStrings(val);
    }
    return acc;
  }, {});
}
