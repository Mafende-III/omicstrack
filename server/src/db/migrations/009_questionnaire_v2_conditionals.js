// Publish v2 of the questionnaire template that adds conditional logic +
// auto-populated fields. Rules baked in:
//
//   1. q_age      — source: patient.age, readOnly
//   2. q_subtype  — source: patient.leukemiaType, editable (pre-fill only)
//   3. q_spouse   — showIf: q_married = 'Yes'
//   4. q_ch_school— showIf: q_children > 0
//   5. Section E  — showIf: patient.treatment = 'On Treatment'
//   6. q_fam_leuk_detail (new field) — showIf: q_fam_leuk = 'Yes'
//
// The migration reads v1 content, applies these patches, and publishes the
// result as v2. v1 stays in DB (inactive) so any questionnaire submitted
// against it can still be regenerated.

const RULES = {
  // Field-level source / readOnly / showIf
  fields: {
    q_age:        { source: 'patient.age',          readOnly: true },
    q_subtype:    { source: 'patient.leukemiaType', readOnly: false },
    q_spouse:     { showIf: { field: 'q_married',  op: 'equals', value: 'Yes' } },
    q_ch_school:  { showIf: { field: 'q_children', op: 'gt',     value: 0 } },
  },
  // Section-level showIf
  sections: {
    E: { showIf: { field: 'patient.treatment', op: 'equals', value: 'On Treatment' } },
  },
};

// New field inserted into section C, immediately after q_fam_leuk
const NEW_FIELD_FAM_LEUK_DETAIL = {
  id: 'q_fam_leuk_detail',
  type: 'textarea',
  required: false,
  options: [],
  labels: {
    en: 'Family member with leukemia — which relative, and when diagnosed?',
    fr: 'Membre de la famille atteint de leucémie — quel parent et quand diagnostiqué ?',
    ki: 'Uwo mu muryango wari ufite kanseri y’amaraso — ni nde kandi yapimwe ryari?',
  },
  showIf: { field: 'q_fam_leuk', op: 'equals', value: 'Yes' },
};

function applyRules(content) {
  if (!content?.sections) return content;

  const sections = content.sections.map((section) => {
    // Section-level showIf
    const sectionPatch = RULES.sections[section.key];
    const newSection = sectionPatch ? { ...section, ...sectionPatch } : { ...section };

    // Patch fields + insert new field where needed
    let fields = section.fields.map((f) => {
      const patch = RULES.fields[f.id];
      return patch ? { ...f, ...patch } : f;
    });

    // Insert q_fam_leuk_detail into section C immediately after q_fam_leuk
    if (section.key === 'C') {
      const idx = fields.findIndex((f) => f.id === 'q_fam_leuk');
      if (idx >= 0 && !fields.some((f) => f.id === 'q_fam_leuk_detail')) {
        fields = [...fields.slice(0, idx + 1), NEW_FIELD_FAM_LEUK_DETAIL, ...fields.slice(idx + 1)];
      }
    }

    newSection.fields = fields;
    return newSection;
  });

  return { ...content, sections };
}

export async function up(knex) {
  const v1 = await knex('questionnaire_templates').where('is_active', true).first();
  if (!v1) {
    throw new Error('No active questionnaire template found — run migrations 004 + 005 first');
  }
  const v1Content = typeof v1.content === 'string' ? JSON.parse(v1.content) : v1.content;
  const v2Content = applyRules(v1Content);

  // Deactivate v1
  await knex('questionnaire_templates').where('is_active', true).update({ is_active: false });

  // Insert v2
  const nextVersion = ((await knex('questionnaire_templates').max('version as v').first())?.v || 0) + 1;
  await knex('questionnaire_templates').insert({
    version: nextVersion,
    content: JSON.stringify(v2Content),
    is_active: true,
    published_at: new Date(),
  });
}

export async function down(knex) {
  // Reactivate v1, remove v2
  const v2 = await knex('questionnaire_templates').where('is_active', true).orderBy('version', 'desc').first();
  if (!v2 || v2.version === 1) return; // nothing to roll back

  await knex('questionnaire_templates').where('id', v2.id).del();
  await knex('questionnaire_templates').where('version', v2.version - 1).update({ is_active: true });
}
