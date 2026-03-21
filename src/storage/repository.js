import { storage } from './engine.js';
import { STORAGE_KEYS as K } from '../constants/index.js';

export const UserRepo = {
  getAll() {
    return storage.get(K.users, []);
  },
  save(users) {
    storage.set(K.users, users);
  },
  add(user) {
    const all = this.getAll();
    all.push(user);
    this.save(all);
  },
  remove(userId) {
    const all = this.getAll().filter((u) => u.id !== userId);
    this.save(all);
  },
  findByCredentials(username, password) {
    return this.getAll().find(
      (u) => u.username === username && u.password === password
    );
  },
};

export const PatientRepo = {
  getAll() {
    return storage.get(K.patients, []);
  },
  save(patients) {
    storage.set(K.patients, patients);
  },
  getById(id) {
    return this.getAll().find((p) => p.id === id);
  },
  add(patient) {
    const all = this.getAll();
    all.push(patient);
    this.save(all);
  },
  update(patient) {
    const all = this.getAll().map((p) =>
      p.id === patient.id ? patient : p
    );
    this.save(all);
  },
};

export const StepRepo = {
  getConsent(patientId) {
    return storage.get(K.consent(patientId), null);
  },
  saveConsent(patientId, data) {
    storage.set(K.consent(patientId), data);
  },
  getQuestionnaire(patientId) {
    return storage.get(K.questionnaire(patientId), null);
  },
  saveQuestionnaire(patientId, data) {
    storage.set(K.questionnaire(patientId), data);
  },
  getCollection(patientId) {
    return storage.get(K.collection(patientId), null);
  },
  saveCollection(patientId, data) {
    storage.set(K.collection(patientId), data);
  },
  getPbmc(patientId) {
    return storage.get(K.pbmc(patientId), null);
  },
  savePbmc(patientId, data) {
    storage.set(K.pbmc(patientId), data);
  },
  getTransfer(patientId) {
    return storage.get(K.transfer(patientId), null);
  },
  saveTransfer(patientId, data) {
    storage.set(K.transfer(patientId), data);
  },
};

export const ShipmentRepo = {
  getAll() {
    return storage.get(K.shipments, []);
  },
  save(shipments) {
    storage.set(K.shipments, shipments);
  },
  getById(id) {
    return this.getAll().find((s) => s.id === id);
  },
  add(shipment) {
    const all = this.getAll();
    all.push(shipment);
    this.save(all);
  },
  update(shipment) {
    const all = this.getAll().map((s) =>
      s.id === shipment.id ? shipment : s
    );
    this.save(all);
  },
  remove(id) {
    const all = this.getAll().filter((s) => s.id !== id);
    this.save(all);
  },
};

export const SessionRepo = {
  get() {
    return storage.get(K.session, null);
  },
  set(session) {
    storage.set(K.session, session);
  },
  clear() {
    storage.remove(K.session);
  },
};

export const PrefsRepo = {
  get() {
    return storage.get(K.preferences, {});
  },
  set(prefs) {
    storage.set(K.preferences, prefs);
  },
};

export const AuditRepo = {
  log(entry) {
    const log = storage.get(K.auditLog, []);
    log.push({
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 entries to avoid storage bloat
    if (log.length > 500) log.splice(0, log.length - 500);
    storage.set(K.auditLog, log);
  },
  getAll() {
    return storage.get(K.auditLog, []);
  },
  getForEntity(entityId) {
    return this.getAll().filter((e) => e.entityId === entityId);
  },
};
