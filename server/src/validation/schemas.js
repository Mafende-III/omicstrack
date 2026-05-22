import { z } from 'zod';

const FACILITIES = ['CHUK', 'RMH', 'KFH', 'Butaro Hospital'];
const ROLES = ['admin', 'entry', 'viewer', 'liege'];
const LEUKEMIA_TYPES = ['AML', 'ALL', 'CLL', 'CML', 'Other'];
const TREATMENTS = ['On Treatment', 'Not on Treatment'];
const SAMPLE_CONDITIONS = ['intact', 'compromised', 'damaged', 'missing', ''];

export const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(200),
  username: z.string().min(1).max(100),
  email: z.string().email().max(200).optional(),
  role: z.enum(ROLES),
  sites: z.array(z.enum(FACILITIES)).default([]),
  canSeePii: z.boolean().default(true),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).nullable().optional(),
  role: z.enum(ROLES).optional(),
  sites: z.array(z.enum(FACILITIES)).optional(),
  canSeePii: z.boolean().optional(),
  capabilities: z.array(z.string()).optional(),
});

export const CreatePatientSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(200),
  age: z.number().int().min(0).max(150),
  leukemiaType: z.enum(LEUKEMIA_TYPES),
  treatment: z.enum(TREATMENTS),
  facility: z.enum(FACILITIES),
});

export const UpdatePatientSchema = z.object({
  code: z.string().min(1).max(10).optional(),
  name: z.string().min(1).max(200).optional(),
  age: z.number().int().min(0).max(150).optional(),
  leukemiaType: z.enum(LEUKEMIA_TYPES).optional(),
  treatment: z.enum(TREATMENTS).optional(),
  facility: z.enum(FACILITIES).optional(),
});

export const ConsentStepSchema = z.object({
  mode: z.enum(['upload', 'fill']).optional(),
  confirmed: z.boolean().optional(),
  patientSignature: z.string().nullable().optional(),
  researcherSignature: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  lang: z.enum(['en', 'fr', 'ki']).optional(),
}).passthrough();

export const QuestionnaireStepSchema = z.object({
  mode: z.enum(['upload', 'fill']).optional(),
  fields: z.record(z.string(), z.any()).optional(),
  sectionsDone: z.record(z.string(), z.boolean()).optional(),
  filePath: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
}).passthrough();

export const CollectionStepSchema = z.object({
  dateTime: z.string().optional(),
  leukemiaType: z.string().optional(),
  tubesConfirmed: z.boolean().optional(),
}).passthrough();

export const PbmcStepSchema = z.object({
  location: z.string().optional(),
  dateTime: z.string().optional(),
  cellCount: z.string().optional(),
  viability: z.string().optional(),
  concentration: z.string().optional(),
  vials: z.union([z.number(), z.string()]).optional(),
  storage: z.object({
    site: z.string().optional(),
    fridge: z.string().optional(),
    shelf: z.string().optional(),
    box: z.string().optional(),
  }).optional(),
}).passthrough();

export const CreateShipmentSchema = z.object({
  shipDate: z.string().min(1),
  samples: z.array(z.object({
    patientId: z.string().uuid(),
    vialsShipped: z.number().int().min(1),
    sampleCondition: z.string().optional(),
    qcCellCount: z.string().optional(),
    qcViability: z.string().optional(),
    qcNotes: z.string().optional(),
  })).min(1),
});

export const ReceiveShipmentSchema = z.object({
  samples: z.array(z.object({
    patientId: z.string().uuid(),
    received: z.boolean().optional(),
    vialsReceived: z.number().int().min(0).nullable().optional(),
    sampleCondition: z.enum(SAMPLE_CONDITIONS).optional(),
    qcCellCount: z.string().optional(),
    qcViability: z.string().optional(),
    qcNotes: z.string().optional(),
  })),
  receiptNotes: z.string().optional(),
});

export const PreferencesSchema = z.object({
  lang: z.enum(['en', 'fr', 'ki']),
});
