const PII_FIELDS = ['name', 'age', 'facility'];

export function stripPii(patient, canSeePii) {
  if (canSeePii) return patient;

  const result = { ...patient };
  for (const field of PII_FIELDS) {
    result[field] = null;
  }
  return result;
}

export function stripPiiFromSample(sample, canSeePii) {
  if (canSeePii) return sample;

  const result = { ...sample };
  result.patientName = null;
  result.facility = null;
  return result;
}

export function canSeeField(canSeePii, field) {
  if (canSeePii) return true;
  return !PII_FIELDS.includes(field);
}
