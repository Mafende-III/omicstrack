// Server-side questionnaire field definitions for PDF generation
// Mirrors client/src/constants/questionnaire.js (labels only)

export const QF = {
  A: [
    { id: 'q_age', en: 'Age (years)' },
    { id: 'q_married', en: 'Marital status' },
    { id: 'q_children', en: 'Number of children (alive)' },
    { id: 'q_ch_dead', en: 'Number of children deceased' },
    { id: 'q_residence', en: 'Residence in last 15 years' },
  ],
  B: [
    { id: 'q_edu', en: 'Education level' },
    { id: 'q_income', en: 'Source of income' },
    { id: 'q_spouse', en: "Spouse's occupation" },
    { id: 'q_ch_school', en: 'Children in school' },
  ],
  C: [
    { id: 'q_health', en: 'Current health problems' },
    { id: 'q_last_clinic', en: 'Last clinic visit date' },
    { id: 'q_fam_health', en: 'Family members with health issues' },
    { id: 'q_fam_leuk', en: 'Family history of leukemia' },
    { id: 'q_diag_date', en: 'Date of leukemia diagnosis' },
    { id: 'q_knows_type', en: 'Aware of leukemia type?' },
  ],
  D: [
    { id: 'q_diag_method', en: 'Diagnostic method' },
    { id: 'q_subtype', en: 'Leukemia subtype' },
    { id: 'q_symptoms', en: 'Initial symptoms at presentation' },
    { id: 'q_ecog', en: 'Performance status (ECOG)' },
    { id: 'q_wbc', en: 'WBC at diagnosis' },
  ],
  E: [
    { id: 'q_cur_tx', en: 'Current treatment' },
    { id: 'q_tx_start', en: 'Treatment start date' },
    { id: 'q_past_tx', en: 'Past treatments' },
    { id: 'q_response', en: 'Response to therapy' },
    { id: 'q_complications', en: 'Complications / side effects' },
  ],
  F: [
    { id: 'q_smoke', en: 'Smoking status' },
    { id: 'q_alcohol', en: 'Alcohol use' },
    { id: 'q_pesticide', en: 'Pesticide/herbicide exposure' },
    { id: 'q_radiation', en: 'Radiation exposure history' },
    { id: 'q_chem', en: 'Chemical/occupational exposure details' },
  ],
};
