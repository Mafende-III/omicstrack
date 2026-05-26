// Per-field PII gating. The user object carries three booleans
// (canSeeName / canSeeAge / canSeeFacility) so admins can grant per-field
// access independently. Non-PII fields are always visible.

const PII_FIELDS_TO_FLAG = {
  name: 'canSeeName',
  age: 'canSeeAge',
  facility: 'canSeeFacility',
};

export function canSeeField(user, field) {
  const flag = PII_FIELDS_TO_FLAG[field];
  if (!flag) return true; // non-PII fields are always visible
  if (!user) return false;
  // Per-field flag takes precedence; fall back to legacy canSeePii for older
  // JWTs/users that don't have the per-field flags populated yet.
  if (user[flag] !== undefined) return user[flag] !== false;
  return user.canSeePii !== false;
}
