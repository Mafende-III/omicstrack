import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserRepo, PatientRepo, PrefsRepo, TemplateRepo } from '../storage/repository.js';
import { api } from '../storage/engine.js';
import { T } from '../constants/translations.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consentTemplate, setConsentTemplate] = useState(null);
  const [questionnaireTemplate, setQuestionnaireTemplate] = useState(null);
  const [ready, setReady] = useState(false);

  const t = T[lang];

  const refreshTemplates = useCallback(async () => {
    try {
      const [c, q] = await Promise.all([
        TemplateRepo.getActive('consent').catch(() => null),
        TemplateRepo.getActive('questionnaire').catch(() => null),
      ]);
      setConsentTemplate(c);
      setQuestionnaireTemplate(q);
    } catch {
      // Non-critical — workflow steps will fall back to static imports
    }
  }, []);

  // Initialize: try to restore session from refresh cookie
  useEffect(() => {
    (async () => {
      try {
        const refreshed = await api.refresh();
        if (refreshed) {
          const me = await api.get('/auth/me');
          setUser(me);

          const prefs = await PrefsRepo.get();
          if (prefs?.lang) setLangState(prefs.lang);

          if (me.role === 'admin') {
            const u = await UserRepo.getAll();
            setUsers(u);
          }

          const pts = await PatientRepo.getAll();
          setPatients(pts);

          await refreshTemplates();
        }
      } catch {
        // No valid session
      }
      setReady(true);
    })();
  }, [refreshTemplates]);

  const setLang = useCallback(async (l) => {
    setLangState(l);
    try {
      await PrefsRepo.set({ lang: l });
    } catch {
      // Non-critical
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const result = await api.post('/auth/login', { username, password });
    api.setToken(result.accessToken);
    setUser(result.user);

    if (result.user.role === 'admin') {
      const u = await UserRepo.getAll();
      setUsers(u);
    }

    const pts = await PatientRepo.getAll();
    setPatients(pts);

    const prefs = await PrefsRepo.get();
    if (prefs?.lang) setLangState(prefs.lang);

    await refreshTemplates();

    return result.user;
  }, [refreshTemplates]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore
    }
    api.clearToken();
    setUser(null);
    setUsers([]);
    setPatients([]);
    setConsentTemplate(null);
    setQuestionnaireTemplate(null);
  }, []);

  const addPatient = useCallback(async (patient) => {
    await PatientRepo.add(patient);
    const pts = await PatientRepo.getAll();
    setPatients(pts);
  }, []);

  const updatePatient = useCallback(async (patient) => {
    await PatientRepo.update(patient);
    const pts = await PatientRepo.getAll();
    setPatients(pts);
  }, []);

  const addUser = useCallback(async (newUser) => {
    const created = await UserRepo.add(newUser);
    const u = await UserRepo.getAll();
    setUsers(u);
    return created;
  }, []);

  const updateUser = useCallback(async (userId, changes) => {
    const updated = await UserRepo.update(userId, changes);
    const u = await UserRepo.getAll();
    setUsers(u);
    return updated;
  }, []);

  const removeUser = useCallback(async (userId) => {
    await UserRepo.remove(userId);
    const u = await UserRepo.getAll();
    setUsers(u);
  }, []);

  const refreshPatients = useCallback(async () => {
    const pts = await PatientRepo.getAll();
    setPatients(pts);
  }, []);

  const logAudit = useCallback(() => {}, []);

  const value = {
    lang, setLang, t,
    user, login, logout,
    users, addUser, updateUser, removeUser,
    patients, addPatient, updatePatient, refreshPatients,
    consentTemplate, questionnaireTemplate, refreshTemplates,
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
