import { useState, useEffect, useCallback } from 'react';
import { StepRepo } from '../storage/repository.js';

const REPO_MAP = {
  consent: { get: StepRepo.getConsent, save: StepRepo.saveConsent },
  questionnaire: { get: StepRepo.getQuestionnaire, save: StepRepo.saveQuestionnaire },
  collection: { get: StepRepo.getCollection, save: StepRepo.saveCollection },
  pbmc: { get: StepRepo.getPbmc, save: StepRepo.savePbmc },
  transfer: { get: StepRepo.getTransfer, save: StepRepo.saveTransfer },
};

export function useStepData(patientId, stepKey, defaultData) {
  const [data, setData] = useState(defaultData);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!patientId || !stepKey) return;
    const repo = REPO_MAP[stepKey];
    if (!repo) return;
    const stored = repo.get(patientId);
    if (stored) setData(stored);
    else setData(defaultData);
  }, [patientId, stepKey]);

  const update = useCallback((changes) => {
    setData((prev) => ({ ...prev, ...changes }));
  }, []);

  const save = useCallback((overrides = {}) => {
    const repo = REPO_MAP[stepKey];
    if (!repo) return;
    const toSave = { ...data, ...overrides };
    setData(toSave);
    repo.save(patientId, toSave);
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
    return toSave;
  }, [data, patientId, stepKey]);

  const submit = useCallback((userId, userName) => {
    const repo = REPO_MAP[stepKey];
    if (!repo) return;
    const toSave = {
      ...data,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy: userId,
    };
    setData(toSave);
    repo.save(patientId, toSave);
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
    return toSave;
  }, [data, patientId, stepKey]);

  return { data, update, save, submit, flash };
}
