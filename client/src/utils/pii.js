const PII_FIELDS = ['name', 'age', 'facility'];

export function canSeeField(canSeePii, field) {
  if (canSeePii) return true;
  return !PII_FIELDS.includes(field);
}
