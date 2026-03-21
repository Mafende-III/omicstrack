export const QF = {
  A: [
    { id: 'q_age', type: 'number', en: 'Age (years)', fr: '\u00c2ge (ann\u00e9es)', ki: 'Imyaka' },
    { id: 'q_married', type: 'select', opts: ['Yes', 'No'], en: 'Marital status', fr: 'Statut matrimonial', ki: 'Urubatse?' },
    { id: 'q_children', type: 'number', en: 'Number of children (alive)', fr: 'Enfants en vie', ki: 'Abana bariho' },
    { id: 'q_ch_dead', type: 'number', en: 'Number of children deceased', fr: 'Enfants d\u00e9c\u00e9d\u00e9s', ki: 'Abana bapfuye' },
    { id: 'q_residence', type: 'textarea', en: 'Residence in last 15 years', fr: 'R\u00e9sidence (15 derni\u00e8res ann\u00e9es)', ki: 'Aho watuye mu myaka 15' },
  ],
  B: [
    { id: 'q_edu', type: 'select', opts: ['None', 'Primary 6', 'Primary 8', 'Vocational', 'Junior High', 'Senior High', 'University'], en: 'Education level', fr: 'Niveau d\u2019\u00e9ducation', ki: 'Amashuri' },
    { id: 'q_income', type: 'text', en: 'Source of income', fr: 'Source de revenus', ki: 'Inkomoko y\u2019umusaruro' },
    { id: 'q_spouse', type: 'text', en: 'Spouse\'s occupation', fr: 'Profession du conjoint', ki: 'Akazi k\u2019uwo mwashakanye' },
    { id: 'q_ch_school', type: 'number', en: 'Children in school', fr: 'Enfants scolaris\u00e9s', ki: 'Abana biga' },
  ],
  C: [
    { id: 'q_health', type: 'textarea', en: 'Current health problems (if any)', fr: 'Probl\u00e8mes de sant\u00e9', ki: 'Uburwayi ufite' },
    { id: 'q_last_clinic', type: 'date', en: 'Last clinic visit date', fr: 'Derni\u00e8re visite m\u00e9dicale', ki: 'Uheruka kwa muganga' },
    { id: 'q_fam_health', type: 'textarea', en: 'Family members with health issues', fr: 'Probl\u00e8mes de sant\u00e9 familiaux', ki: 'Abarwayi mu muryango' },
    { id: 'q_fam_leuk', type: 'select', opts: ['Yes', 'No', 'Unknown'], en: 'Family history of leukemia', fr: 'Ant\u00e9c\u00e9dents familiaux leuc\u00e9mie', ki: 'Amateka ya leukemia mu muryango' },
    { id: 'q_diag_date', type: 'date', en: 'Date of leukemia diagnosis', fr: 'Date du diagnostic', ki: 'Itariki y\u2019isuzuma' },
    { id: 'q_knows_type', type: 'select', opts: ['Yes', 'No'], en: 'Aware of leukemia type?', fr: 'Conna\u00eet son type?', ki: 'Uzi ubwoko bwa leukemia?' },
  ],
  D: [
    { id: 'q_diag_method', type: 'select', opts: ['Bone marrow biopsy', 'Bone marrow aspiration', 'Flow cytometry', 'Cytogenetics', 'Other'], en: 'Diagnostic method', fr: 'M\u00e9thode diagnostique', ki: 'Uburyo bwo gusuzuma' },
    { id: 'q_subtype', type: 'text', en: 'Leukemia subtype (if known)', fr: 'Sous-type (si connu)', ki: 'Ubwoko bwombi' },
    { id: 'q_symptoms', type: 'textarea', en: 'Initial symptoms at presentation', fr: 'Sympt\u00f4mes initiaux', ki: 'Ibimenyetso bya mbere' },
    { id: 'q_ecog', type: 'select', opts: ['0 \u2013 Fully active', '1 \u2013 Restricted', '2 \u2013 Self-care only', '3 \u2013 Limited self-care', '4 \u2013 Bedridden'], en: 'Performance status (ECOG)', fr: 'Statut ECOG', ki: 'Ubushobozi (ECOG)' },
    { id: 'q_wbc', type: 'text', en: 'WBC at diagnosis (if available)', fr: 'Leucocytes au diagnostic', ki: 'Ingano y\u2019amaraso (niba bizi)' },
  ],
  E: [
    { id: 'q_cur_tx', type: 'text', en: 'Current treatment', fr: 'Traitement actuel', ki: 'Ubuvuzi bw\u2019ubu' },
    { id: 'q_tx_start', type: 'date', en: 'Treatment start date', fr: 'D\u00e9but du traitement', ki: 'Itariki yo gutangira ubuvuzi' },
    { id: 'q_past_tx', type: 'textarea', en: 'Past treatments', fr: 'Traitements pass\u00e9s', ki: 'Ubuvuzi bwabanjirije' },
    { id: 'q_response', type: 'select', opts: ['Complete remission', 'Partial remission', 'No response', 'Relapse', 'N/A'], en: 'Response to therapy', fr: 'R\u00e9ponse au traitement', ki: 'Igisubizo ku buvuzi' },
    { id: 'q_complications', type: 'textarea', en: 'Complications / side effects', fr: 'Complications', ki: 'Ingaruka mbi z\u2019ubuvuzi' },
  ],
  F: [
    { id: 'q_smoke', type: 'select', opts: ['Never', 'Former smoker', 'Current smoker'], en: 'Smoking status', fr: 'Tabagisme', ki: 'Itabi' },
    { id: 'q_alcohol', type: 'select', opts: ['Never', 'Occasional', 'Regular', 'Heavy'], en: 'Alcohol use', fr: 'Consommation d\u2019alcool', ki: 'Inzoga' },
    { id: 'q_pesticide', type: 'select', opts: ['Yes', 'No'], en: 'Pesticide/herbicide exposure', fr: 'Exposition pesticides', ki: 'Gusangira na pesticide' },
    { id: 'q_radiation', type: 'textarea', en: 'Radiation exposure history', fr: 'Exposition aux radiations', ki: 'Amateka ya radiyo' },
    { id: 'q_chem', type: 'textarea', en: 'Chemical/occupational exposure details', fr: 'Exposition chimique/professionnelle', ki: 'Imiti/akazi ingaruka' },
  ],
};
