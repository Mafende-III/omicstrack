import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { StepRepo } from '../../storage/repository.js';
import { STEP_KEYS, SITES, LK_TYPES } from '../../constants/index.js';
import ConsentStep from '../workflow/ConsentStep.jsx';
import QuestionnaireStep from '../workflow/QuestionnaireStep.jsx';
import CollectionStep from '../workflow/CollectionStep.jsx';
import PBMCStep from '../workflow/PBMCStep.jsx';
import TransferStep from '../workflow/TransferStep.jsx';

function StepBar({ current, completedSteps, t, onNav }) {
  return (
    <div className="stepbar">
      {STEP_KEYS.map((s, i) => {
        const done = completedSteps.includes(s);
        const active = current === s;
        const prevDone = i > 0 && completedSteps.includes(STEP_KEYS[i - 1]);
        return (
          <div key={s} className="step-item">
            <div className="step-top">
              {i > 0 && <div className={`sline ${prevDone ? (done ? 'done' : 'active') : ''}`} />}
              <div
                className={`snum ${done ? 'done' : active ? 'active' : ''}`}
                onClick={() => onNav(s)}
              >
                {done ? '\u2713' : i + 1}
              </div>
              {i < STEP_KEYS.length - 1 && <div className={`sline ${done ? 'done' : ''}`} />}
            </div>
            <div className={`slbl ${done ? 'done' : active ? 'active' : ''}`}>{t.steps[s]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PatientDetail({ patient, onBack }) {
  const { user, t, lang, updatePatient } = useApp();
  const role = user?.role;
  const defaultStep = role === 'liege' ? 'transfer' : 'consent';
  const [step, setStep] = useState(defaultStep);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...patient });
  const [completed, setCompleted] = useState([]);

  const readOnly = role === 'viewer' || role === 'liege';

  const checkCompleted = useCallback(() => {
    const checks = [
      StepRepo.getConsent(patient.id)?.submitted,
      StepRepo.getQuestionnaire(patient.id)?.submitted,
      StepRepo.getCollection(patient.id)?.submitted,
      StepRepo.getPbmc(patient.id)?.submitted,
      StepRepo.getTransfer(patient.id)?.submitted,
    ];
    setCompleted(STEP_KEYS.filter((_, i) => checks[i]));
  }, [patient.id]);

  useEffect(() => { checkCompleted(); }, [checkCompleted]);

  const saveEdit = () => {
    const updated = {
      ...form,
      age: parseInt(form.age, 10) || form.age,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.id,
    };
    updatePatient(updated);
    setEditing(false);
  };

  return (
    <div className="fade">
      <button className="back" onClick={onBack}>&larr; {t.pt.back}</button>

      {editing ? (
        <div className="card">
          <div className="ct">{t.pt.edit}</div>
          <div className="g2">
            <div className="f"><label className="lbl">{t.pt.code}</label><input className="inp" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} /></div>
            <div className="f"><label className="lbl">{t.pt.name}</label><input className="inp" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="f"><label className="lbl">{t.pt.age}</label><input type="number" className="inp" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} /></div>
            <div className="f"><label className="lbl">{t.pt.type}</label><select className="sel" value={form.leukemiaType} onChange={(e) => setForm((p) => ({ ...p, leukemiaType: e.target.value }))}>{LK_TYPES.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div className="f"><label className="lbl">{t.pt.tx}</label><select className="sel" value={form.treatment} onChange={(e) => setForm((p) => ({ ...p, treatment: e.target.value }))}><option value="On Treatment">{t.pt.onTx}</option><option value="Not on Treatment">{t.pt.offTx}</option></select></div>
            <div className="f"><label className="lbl">{t.pt.fac}</label><select className="sel" value={form.facility} onChange={(e) => setForm((p) => ({ ...p, facility: e.target.value }))}>{SITES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="fc gap8 mt12" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-bd" onClick={() => setEditing(false)}>{t.pt.cancel}</button>
            <button className="btn btn-ac" onClick={saveEdit}>{t.pt.save}</button>
          </div>
        </div>
      ) : (
        <div className="pt-banner">
          <div className="fb">
            <div>
              <div className="fc gap8 mb6">
                <span className="code-pill">{patient.code}</span>
                <span className="pt-bn">{patient.name}</span>
              </div>
              <div className="pt-bm">
                <span>{patient.age} yrs</span>
                <span>&middot;</span>
                <span className={`badge ${patient.treatment === 'On Treatment' ? 'b-ok' : 'b-muted'}`}>
                  {patient.treatment === 'On Treatment' ? t.pt.onTx : t.pt.offTx}
                </span>
                <span className="badge b-ac">{patient.leukemiaType}</span>
                <span className="badge b-muted">{patient.facility}</span>
                <span style={{ color: 'var(--tx3)', fontSize: '.68rem' }}>
                  {t.pt.enrolled}: {patient.enrolledAt?.split('T')[0]}
                </span>
              </div>
            </div>
            {!readOnly && (
              <button className="btn btn-bd btn-sm" onClick={() => setEditing(true)}>
                {t.pt.edit}
              </button>
            )}
          </div>
        </div>
      )}

      <StepBar
        current={step}
        completedSteps={completed}
        t={t}
        onNav={(s) => { setStep(s); checkCompleted(); }}
      />

      {step === 'consent' && <ConsentStep patientId={patient.id} readOnly={readOnly} onComplete={checkCompleted} />}
      {step === 'questionnaire' && <QuestionnaireStep patientId={patient.id} readOnly={readOnly} onComplete={checkCompleted} />}
      {step === 'collection' && <CollectionStep patientId={patient.id} patient={patient} readOnly={readOnly} onComplete={checkCompleted} />}
      {step === 'pbmc' && <PBMCStep patientId={patient.id} readOnly={readOnly} onComplete={checkCompleted} />}
      {step === 'transfer' && <TransferStep patientId={patient.id} onComplete={checkCompleted} />}
    </div>
  );
}
