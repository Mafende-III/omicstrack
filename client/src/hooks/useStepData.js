import { useState, useEffect, useCallback } from 'react';
import { StepRepo } from '../storage/repository.js';

const REPO_MAP = {
  consent: {
    get: (pid) => StepRepo.getConsent(pid),
    save: (pid, d) => StepRepo.saveConsent(pid, d),
    submit: (pid, d) => StepRepo.submitStep(pid, 'consent', d),
  },
  questionnaire: {
    get: (pid) => StepRepo.getQuestionnaire(pid),
    save: (pid, d) => StepRepo.saveQuestionnaire(pid, d),
    submit: (pid, d) => StepRepo.submitStep(pid, 'questionnaire', d),
  },
  collection: {
    get: (pid) => StepRepo.getCollection(pid),
    save: (pid, d) => StepRepo.saveCollection(pid, d),
    submit: (pid, d) => StepRepo.submitStep(pid, 'collection', d),
  },
  pbmc: {
    get: (pid) => StepRepo.getPbmc(pid),
    save: (pid, d) => StepRepo.savePbmc(pid, d),
    submit: (pid, d) => StepRepo.submitStep(pid, 'pbmc', d),
  },
  transfer: {
    get: (pid) => StepRepo.getTransfer(pid),
    save: (pid, d) => StepRepo.saveTransfer(pid, d),
  },
};

export function useStepData(patientId, stepKey, defaultData) {
  const [data, setData] = useState(defaultData);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !stepKey) return;
    const repo = REPO_MAP[stepKey];
    if (!repo) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const stored = await repo.get(patientId);
        if (!cancelled) {
          setData(stored || defaultData);
        }
      } catch {
        if (!cancelled) setData(defaultData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [patientId, stepKey]);

  const update = useCallback((changes) => {
    setData((prev) => ({ ...prev, ...changes }));
  }, []);

  const save = useCallback(async (overrides = {}) => {
    const repo = REPO_MAP[stepKey];
    if (!repo) return;
    const toSave = { ...data, ...overrides };
    setData(toSave);
    try {
      await repo.save(patientId, toSave);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
    return toSave;
  }, [data, patientId, stepKey]);

  const submit = useCallback(async (userId, userName, overrides = {}) => {
    const repo = REPO_MAP[stepKey];
    if (!repo) return;
    const payload = { ...data, ...overrides };
    try {
      if (repo.submit) {
        const result = await repo.submit(patientId, payload);
        const merged = {
          ...payload,
          ...result,
          submitted: true,
          submittedAt: result?.submittedAt || new Date().toISOString(),
          submittedBy: result?.submittedBy || userId,
        };
        setData(merged);
        setFlash(true);
        setTimeout(() => setFlash(false), 2000);
        return merged;
      }
      const toSave = {
        ...payload,
        submitted: true,
        submittedAt: new Date().toISOString(),
        submittedBy: userId,
      };
      setData(toSave);
      await repo.save(patientId, toSave);
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
      return toSave;
    } catch (err) {
      console.error('Submit failed:', err);
    }
  }, [data, patientId, stepKey]);

  return { data, update, save, submit, flash, loading };
}
