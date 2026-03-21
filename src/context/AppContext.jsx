import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserRepo, PatientRepo, SessionRepo, PrefsRepo, AuditRepo } from '../storage/repository.js';
import { DEF_USERS, SEED_PATIENTS } from '../constants/seedData.js';
import { T } from '../constants/translations.js';
import { runMigrations } from '../storage/migrate.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [ready, setReady] = useState(false);

  const t = T[lang];

  // Initialize on mount
  useEffect(() => {
    runMigrations();

    const prefs = PrefsRepo.get();
    if (prefs.lang) setLangState(prefs.lang);

    let u = UserRepo.getAll();
    if (!u || u.length === 0) {
      UserRepo.save(DEF_USERS);
      u = DEF_USERS;
    } else {
      // Ensure default admin always exists (cannot be accidentally removed)
      const adminExists = u.some((x) => x.id === 'u_esp');
      if (!adminExists) {
        const adminUser = DEF_USERS.find((x) => x.id === 'u_esp');
        u.push(adminUser);
        UserRepo.save(u);
      }
    }
    setUsers(u);

    const sess = SessionRepo.get();
    if (sess) {
      const found = u.find((x) => x.id === sess.id);
      if (found) setUser(found);
    }

    let pts = PatientRepo.getAll();
    if (!pts || pts.length === 0) {
      PatientRepo.save(SEED_PATIENTS);
      pts = SEED_PATIENTS;
    }
    setPatients(pts);

    setReady(true);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    const prefs = PrefsRepo.get();
    PrefsRepo.set({ ...prefs, lang: l });
  }, []);

  const login = useCallback((u) => {
    setUser(u);
    SessionRepo.set({ id: u.id });
    AuditRepo.log({
      userId: u.id,
      userName: u.name,
      action: 'user.login',
      entityType: 'user',
      entityId: u.id,
      details: `${u.name} logged in`,
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    SessionRepo.clear();
  }, []);

  const addPatient = useCallback((patient) => {
    const pts = PatientRepo.getAll();
    pts.push(patient);
    PatientRepo.save(pts);
    setPatients(pts);
    AuditRepo.log({
      userId: user?.id,
      userName: user?.name,
      action: 'patient.create',
      entityType: 'patient',
      entityId: patient.id,
      details: `Patient ${patient.code} - ${patient.name} added`,
    });
  }, [user]);

  const updatePatient = useCallback((patient) => {
    const pts = PatientRepo.getAll().map((p) =>
      p.id === patient.id ? patient : p
    );
    PatientRepo.save(pts);
    setPatients(pts);
    AuditRepo.log({
      userId: user?.id,
      userName: user?.name,
      action: 'patient.update',
      entityType: 'patient',
      entityId: patient.id,
      details: `Patient ${patient.code} updated`,
    });
  }, [user]);

  const addUser = useCallback((newUser) => {
    const all = UserRepo.getAll();
    all.push(newUser);
    UserRepo.save(all);
    setUsers(all);
    AuditRepo.log({
      userId: user?.id,
      userName: user?.name,
      action: 'user.create',
      entityType: 'user',
      entityId: newUser.id,
      details: `User ${newUser.name} created with role ${newUser.role}`,
    });
  }, [user]);

  const removeUser = useCallback((userId) => {
    if (userId === 'u_esp') return; // Protect default admin
    const target = users.find((u) => u.id === userId);
    const all = UserRepo.getAll().filter((u) => u.id !== userId);
    UserRepo.save(all);
    setUsers(all);
    AuditRepo.log({
      userId: user?.id,
      userName: user?.name,
      action: 'user.remove',
      entityType: 'user',
      entityId: userId,
      details: `User ${target?.name || userId} removed`,
    });
  }, [user, users]);

  const logAudit = useCallback((action, entityType, entityId, details) => {
    AuditRepo.log({
      userId: user?.id,
      userName: user?.name,
      action,
      entityType,
      entityId,
      details,
    });
  }, [user]);

  const refreshPatients = useCallback(() => {
    setPatients(PatientRepo.getAll());
  }, []);

  const value = {
    lang, setLang, t,
    user, login, logout,
    users, addUser, removeUser,
    patients, addPatient, updatePatient, refreshPatients,
    logAudit,
    ready,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
