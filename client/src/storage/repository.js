import { api } from './engine.js';

export const UserRepo = {
  async getAll() {
    return api.get('/users');
  },
  async add(user) {
    return api.post('/users', user);
  },
  async update(userId, changes) {
    return api.put(`/users/${userId}`, changes);
  },
  async remove(userId) {
    return api.del(`/users/${userId}`);
  },
};

export const PatientRepo = {
  async getAll() {
    return api.get('/patients');
  },
  async getById(id) {
    return api.get(`/patients/${id}`);
  },
  async add(patient) {
    return api.post('/patients', patient);
  },
  async update(patient) {
    return api.put(`/patients/${patient.id}`, patient);
  },
  async remove(id) {
    return api.del(`/patients/${id}`);
  },
};

export const StepRepo = {
  async getConsent(patientId) {
    return api.get(`/steps/${patientId}/consent`).catch(() => null);
  },
  async saveConsent(patientId, data) {
    return api.put(`/steps/${patientId}/consent`, data);
  },

  async getQuestionnaire(patientId) {
    return api.get(`/steps/${patientId}/questionnaire`).catch(() => null);
  },
  async saveQuestionnaire(patientId, data) {
    return api.put(`/steps/${patientId}/questionnaire`, data);
  },

  async getCollection(patientId) {
    return api.get(`/steps/${patientId}/collection`).catch(() => null);
  },
  async saveCollection(patientId, data) {
    return api.put(`/steps/${patientId}/collection`, data);
  },

  async getPbmc(patientId) {
    return api.get(`/steps/${patientId}/pbmc`).catch(() => null);
  },
  async savePbmc(patientId, data) {
    return api.put(`/steps/${patientId}/pbmc`, data);
  },

  async getTransfer(patientId) {
    return api.get(`/steps/${patientId}/transfer`).catch(() => null);
  },
  async saveTransfer(patientId, data) {
    return api.put(`/steps/${patientId}/transfer`, data);
  },

  async submitStep(patientId, step, data) {
    return api.post(`/steps/${patientId}/${step}/submit`, data);
  },
};

export const ShipmentRepo = {
  async getAll() {
    return api.get('/shipments');
  },
  async getById(id) {
    return api.get(`/shipments/${id}`);
  },
  async add(shipment) {
    return api.post('/shipments', shipment);
  },
  async remove(id) {
    return api.del(`/shipments/${id}`);
  },
};

export const SessionRepo = {
  get() { return null; },
  set() {},
  clear() {},
};

export const PrefsRepo = {
  async get() {
    return api.get('/preferences').catch(() => ({ lang: 'en' }));
  },
  async set(prefs) {
    return api.put('/preferences', prefs);
  },
};

export const TemplateRepo = {
  async getActive(kind) {
    return api.get(`/templates/${kind}/active`);
  },
  async listVersions(kind) {
    return api.get(`/templates/${kind}/versions`);
  },
  async getVersion(kind, id) {
    return api.get(`/templates/${kind}/${id}`);
  },
  async publishVersion(kind, content) {
    return api.post(`/templates/${kind}`, { content });
  },
};

export const AuditRepo = {
  log() {},
  async getAll() {
    return api.get('/audit').then((r) => r.entries || []);
  },
  async getForEntity(entityId) {
    return api.get(`/audit/entity/${entityId}`);
  },
};

export const NotesRepo = {
  // step: undefined = all notes for patient; 'overall' = top-level only; or a step key
  async list(patientId, step) {
    const qs = step ? `?step=${encodeURIComponent(step)}` : '';
    return api.get(`/patients/${patientId}/notes${qs}`);
  },
  async create(patientId, body, step = null) {
    return api.post(`/patients/${patientId}/notes`, { body, step });
  },
  async remove(patientId, noteId) {
    return api.del(`/patients/${patientId}/notes/${noteId}`);
  },
};
