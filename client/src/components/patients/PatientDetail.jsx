import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { api } from '../../storage/engine.js';
import { STEP_KEYS, SITES, LK_TYPES } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';
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
  const { user, t, lang, updatePatient, removePatient } = useApp();
  const role = user?.role;
  const defaultStep = role === 'liege' ? 'transfer' : 'consent';
  const [step, setStep] = useState(defaultStep);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...patient });
  const [completed, setCompleted] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const readOnly = role === 'viewer' || role === 'liege';
  const canDelete = hasCapability(user, CAPABILITIES.DELETE_PATIENT);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removePatient(patient.id);
      onBack?.();
    } catch (err) {
      setDeleting(false);
      alert(err.message || 'Failed to delete patient');
    }
  };

  const checkCompleted = useCallback(async () => {
    try {
      const detail = await api.get(`/patients/${patient.id}`);
      if (detail?.steps) {
        setCompleted(STEP_KEYS.filter((k) => detail.steps[k]));
      }
    } catch {
      // ignore
    }
  }, [patient.id]);

  useEffect(() => { checkCompleted(); }, [checkCompleted]);

  const saveEdit = async () => {
    const updated = {
      ...form,
      age: parseInt(form.age, 10) || form.age,
    };
    await updatePatient(updated);
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
                {canSeeField(user?.canSeePii, 'name') && <span className="pt-bn">{patient.name}</span>}
              </div>
              <div className="pt-bm">
                {patient.age != null && <><span>{patient.age} yrs</span><span>&middot;</span></>}
                <span className={`badge ${patient.treatment === 'On Treatment' ? 'b-ok' : 'b-muted'}`}>
                  {patient.treatment === 'On Treatment' ? t.pt.onTx : t.pt.offTx}
                </span>
                <span className="badge b-ac">{patient.leukemiaType}</span>
                {patient.facility && <span className="badge b-muted">{patient.facility}</span>}
                <span style={{ color: 'var(--tx3)', fontSize: '.68rem' }}>
                  {t.pt.enrolled}: {patient.enrolledAt?.split('T')[0]}
                </span>
              </div>
            </div>
            <div className="fc gap6">
              {!readOnly && (
                <button className="btn btn-bd btn-sm" onClick={() => setEditing(true)}>
                  {t.pt.edit}
                </button>
              )}
              {canDelete && (
                <button className="btn btn-err btn-sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div className="card" style={{ maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ct" style={{ color: 'var(--err)' }}>Delete patient — this cannot be undone</div>
            <p style={{ fontSize: '.9rem', color: 'var(--tx)', lineHeight: 1.6, margin: '8px 0 12px' }}>
              You are about to permanently delete <strong>{patient.code} · {patient.name || '(name hidden)'}</strong>.
            </p>
            <p style={{ fontSize: '.85rem', color: 'var(--tx2)', lineHeight: 1.6, marginBottom: 16 }}>
              This will also delete all linked records: consent, questionnaire, collection, PBMC,
              and shipment entries for this patient. The action is logged in the audit trail but
              the data itself cannot be recovered from the application.
            </p>
            <p style={{ fontSize: '.8rem', color: 'var(--tx3)', marginBottom: 16 }}>
              For IRB-bound research data, consider whether deletion is truly necessary versus
              flagging the record as withdrawn.
            </p>
            <div className="fc gap8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-bd" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-err" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : `Delete ${patient.code}`}
              </button>
            </div>
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
