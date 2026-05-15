import { CONSENT_TEMPLATE } from '../../constants/consentTemplate.js';

// Initial questionnaire content as canonical structured JSON.
// Source: client/src/constants/questionnaire.js + translations.qsec
const INITIAL_QUESTIONNAIRE = {
  sections: [
    {
      key: 'A',
      labels: { en: 'A — Identity', fr: 'A — Identité', ki: 'A — Imyoborere' },
      fields: [
        { id: 'q_age', type: 'number', required: false, options: [], labels: { en: 'Age (years)', fr: 'Âge (années)', ki: 'Imyaka' } },
        { id: 'q_married', type: 'select', required: false, options: ['Yes', 'No'], labels: { en: 'Marital status', fr: 'Statut matrimonial', ki: 'Urubatse?' } },
        { id: 'q_children', type: 'number', required: false, options: [], labels: { en: 'Number of children (alive)', fr: 'Enfants en vie', ki: 'Abana bariho' } },
        { id: 'q_ch_dead', type: 'number', required: false, options: [], labels: { en: 'Number of children deceased', fr: 'Enfants décédés', ki: 'Abana bapfuye' } },
        { id: 'q_residence', type: 'textarea', required: false, options: [], labels: { en: 'Residence in last 15 years', fr: 'Résidence (15 dernières années)', ki: 'Aho watuye mu myaka 15' } },
      ],
    },
    {
      key: 'B',
      labels: { en: 'B — Socio-economic', fr: 'B — Socio-économique', ki: 'B — Imibereho' },
      fields: [
        { id: 'q_edu', type: 'select', required: false, options: ['None', 'Primary 6', 'Primary 8', 'Vocational', 'Junior High', 'Senior High', 'University'], labels: { en: 'Education level', fr: 'Niveau d’éducation', ki: 'Amashuri' } },
        { id: 'q_income', type: 'text', required: false, options: [], labels: { en: 'Source of income', fr: 'Source de revenus', ki: 'Inkomoko y’umusaruro' } },
        { id: 'q_spouse', type: 'text', required: false, options: [], labels: { en: "Spouse's occupation", fr: 'Profession du conjoint', ki: 'Akazi k’uwo mwashakanye' } },
        { id: 'q_ch_school', type: 'number', required: false, options: [], labels: { en: 'Children in school', fr: 'Enfants scolarisés', ki: 'Abana biga' } },
      ],
    },
    {
      key: 'C',
      labels: { en: 'C — Health', fr: 'C — Santé', ki: 'C — Ubuzima' },
      fields: [
        { id: 'q_health', type: 'textarea', required: false, options: [], labels: { en: 'Current health problems (if any)', fr: 'Problèmes de santé', ki: 'Uburwayi ufite' } },
        { id: 'q_last_clinic', type: 'date', required: false, options: [], labels: { en: 'Last clinic visit date', fr: 'Dernière visite médicale', ki: 'Uheruka kwa muganga' } },
        { id: 'q_fam_health', type: 'textarea', required: false, options: [], labels: { en: 'Family members with health issues', fr: 'Problèmes de santé familiaux', ki: 'Abarwayi mu muryango' } },
        { id: 'q_fam_leuk', type: 'select', required: false, options: ['Yes', 'No', 'Unknown'], labels: { en: 'Family history of leukemia', fr: 'Antécédents familiaux leucémie', ki: 'Amateka ya leukemia mu muryango' } },
        { id: 'q_diag_date', type: 'date', required: false, options: [], labels: { en: 'Date of leukemia diagnosis', fr: 'Date du diagnostic', ki: 'Itariki y’isuzuma' } },
        { id: 'q_knows_type', type: 'select', required: false, options: ['Yes', 'No'], labels: { en: 'Aware of leukemia type?', fr: 'Connaît son type?', ki: 'Uzi ubwoko bwa leukemia?' } },
      ],
    },
    {
      key: 'D',
      labels: { en: 'D — Clinical / Diagnosis', fr: 'D — Clinique', ki: 'D — Isuzuma' },
      fields: [
        { id: 'q_diag_method', type: 'select', required: false, options: ['Bone marrow biopsy', 'Bone marrow aspiration', 'Flow cytometry', 'Cytogenetics', 'Other'], labels: { en: 'Diagnostic method', fr: 'Méthode diagnostique', ki: 'Uburyo bwo gusuzuma' } },
        { id: 'q_subtype', type: 'text', required: false, options: [], labels: { en: 'Leukemia subtype (if known)', fr: 'Sous-type (si connu)', ki: 'Ubwoko bwombi' } },
        { id: 'q_symptoms', type: 'textarea', required: false, options: [], labels: { en: 'Initial symptoms at presentation', fr: 'Symptômes initiaux', ki: 'Ibimenyetso bya mbere' } },
        { id: 'q_ecog', type: 'select', required: false, options: ['0 – Fully active', '1 – Restricted', '2 – Self-care only', '3 – Limited self-care', '4 – Bedridden'], labels: { en: 'Performance status (ECOG)', fr: 'Statut ECOG', ki: 'Ubushobozi (ECOG)' } },
        { id: 'q_wbc', type: 'text', required: false, options: [], labels: { en: 'WBC at diagnosis (if available)', fr: 'Leucocytes au diagnostic', ki: 'Ingano y’amaraso (niba bizi)' } },
      ],
    },
    {
      key: 'E',
      labels: { en: 'E — Treatment History', fr: 'E — Traitement', ki: 'E — Ubuvuzi' },
      fields: [
        { id: 'q_cur_tx', type: 'text', required: false, options: [], labels: { en: 'Current treatment', fr: 'Traitement actuel', ki: 'Ubuvuzi bw’ubu' } },
        { id: 'q_tx_start', type: 'date', required: false, options: [], labels: { en: 'Treatment start date', fr: 'Début du traitement', ki: 'Itariki yo gutangira ubuvuzi' } },
        { id: 'q_past_tx', type: 'textarea', required: false, options: [], labels: { en: 'Past treatments', fr: 'Traitements passés', ki: 'Ubuvuzi bwabanjirije' } },
        { id: 'q_response', type: 'select', required: false, options: ['Complete remission', 'Partial remission', 'No response', 'Relapse', 'N/A'], labels: { en: 'Response to therapy', fr: 'Réponse au traitement', ki: 'Igisubizo ku buvuzi' } },
        { id: 'q_complications', type: 'textarea', required: false, options: [], labels: { en: 'Complications / side effects', fr: 'Complications', ki: 'Ingaruka mbi z’ubuvuzi' } },
      ],
    },
    {
      key: 'F',
      labels: { en: 'F — Environmental', fr: 'F — Environnement', ki: 'F — Ibidukikije' },
      fields: [
        { id: 'q_smoke', type: 'select', required: false, options: ['Never', 'Former smoker', 'Current smoker'], labels: { en: 'Smoking status', fr: 'Tabagisme', ki: 'Itabi' } },
        { id: 'q_alcohol', type: 'select', required: false, options: ['Never', 'Occasional', 'Regular', 'Heavy'], labels: { en: 'Alcohol use', fr: 'Consommation d’alcool', ki: 'Inzoga' } },
        { id: 'q_pesticide', type: 'select', required: false, options: ['Yes', 'No'], labels: { en: 'Pesticide/herbicide exposure', fr: 'Exposition pesticides', ki: 'Gusangira na pesticide' } },
        { id: 'q_radiation', type: 'textarea', required: false, options: [], labels: { en: 'Radiation exposure history', fr: 'Exposition aux radiations', ki: 'Amateka ya radiyo' } },
        { id: 'q_chem', type: 'textarea', required: false, options: [], labels: { en: 'Chemical/occupational exposure details', fr: 'Exposition chimique/professionnelle', ki: 'Imiti/akazi ingaruka' } },
      ],
    },
  ],
};

export async function up(knex) {
  const now = new Date();

  await knex('consent_templates').insert({
    version: 1,
    content: JSON.stringify(CONSENT_TEMPLATE),
    is_active: true,
    published_at: now,
  });

  await knex('questionnaire_templates').insert({
    version: 1,
    content: JSON.stringify(INITIAL_QUESTIONNAIRE),
    is_active: true,
    published_at: now,
  });
}

export async function down(knex) {
  await knex('consent_templates').where('version', 1).del();
  await knex('questionnaire_templates').where('version', 1).del();
}
