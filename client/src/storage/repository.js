import { api } from './engine.js';

export const UserRepo = {
  async getAll() {
    return api.get('/users');
  },
  async add(user) {
    return api.post('/users', user);
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

export const AuditRepo = {
  log() {},
  async getAll() {
    return api.get('/audit').then((r) => r.entries || []);
  },
  async getForEntity(entityId) {
    return api.get(`/audit/entity/${entityId}`);
  },
};
