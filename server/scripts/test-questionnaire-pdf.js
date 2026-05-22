// Render a sample questionnaire PDF to /tmp/test-questionnaire.pdf so we can
// visually compare it to the consent PDF.
import fs from 'fs';
import { generateQuestionnairePdf } from '../src/services/pdfGenerator.js';

const sectionDefs = [
  {
    key: 'A',
    label: 'A — Identity',
    fields: [
      { id: 'q_age', label: 'Age (years)' },
      { id: 'q_married', label: 'Marital status' },
      { id: 'q_children', label: 'Number of children (alive)' },
      { id: 'q_ch_dead', label: 'Number of children deceased' },
      { id: 'q_residence', label: 'Residence in last 15 years' },
    ],
  },
  {
    key: 'B',
    label: 'B — Socio-economic',
    fields: [
      { id: 'q_edu', label: 'Education level' },
      { id: 'q_income', label: 'Source of income' },
      { id: 'q_spouse', label: "Spouse's occupation" },
    ],
  },
  {
    key: 'F',
    label: 'F — Environmental',
    fields: [
      { id: 'q_smoke', label: 'Smoking status' },
      { id: 'q_alcohol', label: 'Alcohol use' },
      { id: 'q_pesticide', label: 'Pesticide/herbicide exposure' },
    ],
  },
];

const answers = {
  q_age: '48',
  q_married: 'Yes',
  q_children: '3',
  q_ch_dead: '0',
  q_residence: 'Kigali (Gasabo district) for the last 12 years; previously Musanze.',
  q_edu: 'Senior High',
  q_income: 'Agriculture',
  q_spouse: 'Teacher',
  q_smoke: 'Never',
  q_alcohol: 'Occasional',
  q_pesticide: 'Yes',
};

const buf = await generateQuestionnairePdf({
  title: 'Patient Questionnaire',
  studyTitle: 'Study Title: Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population',
  patientCode: '001',
  patientName: 'GASANA Claude',
  patientFacility: 'RMH',
  patientAge: 48,
  patientLeukemiaType: 'AML',
  sectionDefs,
  answers,
  submittedAt: '2026-05-21',
  submittedBy: 'Esperance Umumararungu',
});

fs.writeFileSync('/tmp/test-questionnaire.pdf', buf);
console.log('wrote /tmp/test-questionnaire.pdf', buf.length, 'bytes');
