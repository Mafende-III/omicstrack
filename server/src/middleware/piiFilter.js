// PII gating helpers. Each PII field has its own boolean on the user object
// (canSeeName / canSeeAge / canSeeFacility) so admins can grant per-field
// access. A user with all three true sees the whole patient record; a user
// with all three false sees neither name, age, nor facility.

const PII_FIELDS_TO_FLAG = {
  name: 'canSeeName',
  age: 'canSeeAge',
  facility: 'canSeeFacility',
};

function canSeeFieldForUser(user, field) {
  const flag = PII_FIELDS_TO_FLAG[field];
  if (!flag) return true; // non-PII fields are always visible
  if (!user) return false;
  return user[flag] !== false;
}

export function stripPii(patient, user) {
  if (!patient) return patient;
  const result = { ...patient };
  for (const field of Object.keys(PII_FIELDS_TO_FLAG)) {
    if (!canSeeFieldForUser(user, field)) result[field] = null;
  }
  return result;
}

export function stripPiiFromSample(sample, user) {
  if (!sample) return sample;
  const result = { ...sample };
  if (!canSeeFieldForUser(user, 'name')) result.patientName = null;
  if (!canSeeFieldForUser(user, 'facility')) result.facility = null;
  return result;
}

export function canSeeField(user, field) {
  return canSeeFieldForUser(user, field);
}
