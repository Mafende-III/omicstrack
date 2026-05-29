// Reset / Replace button used in every workflow step's submitted state.
//
// Label is "Replace" when the step holds an uploaded file (so users can swap
// it for a corrected version) and "Reset" otherwise (digital-signed consent,
// filled questionnaire, etc.).
//
// Capability gate: edit_patient AND the matching submit_<step> capability —
// both are enforced server-side too. We hide the button when the user lacks
// either, so the UI matches what the API will allow.
//
// Destructive: the server deletes the row entirely. The next GET returns
// null and the step renders its empty form. An audit log row is written
// server-side so IRB can trace why a record was reset.

import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { StepRepo } from '../../storage/repository.js';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';

const STEP_SUBMIT_CAP = {
  consent: CAPABILITIES.SUBMIT_CONSENT,
  questionnaire: CAPABILITIES.SUBMIT_QUESTIONNAIRE,
  collection: CAPABILITIES.SUBMIT_COLLECTION,
  pbmc: CAPABILITIES.SUBMIT_PBMC,
};

const STEP_LABEL = {
  consent: 'consent',
  questionnaire: 'questionnaire',
  collection: 'collection',
  pbmc: 'PBMC isolation',
};

export default function ResetStepButton({ patientId, step, mode, onReset }) {
  const { user } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [err, setErr] = useState('');

  const submitCap = STEP_SUBMIT_CAP[step];
  if (!submitCap) return null;

  const canReset =
    hasCapability(user, CAPABILITIES.EDIT_PATIENT) &&
    hasCapability(user, submitCap);
  if (!canReset) return null;

  const isUpload = mode === 'upload';
  const action = isUpload ? 'Replace' : 'Reset';
  const stepName = STEP_LABEL[step] || step;

  const doReset = async () => {
    setResetting(true);
    setErr('');
    try {
      await StepRepo.resetStep(patientId, step);
      setConfirming(false);
      onReset?.();
    } catch (e) {
      setErr(e.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-bd btn-sm"
        onClick={() => setConfirming(true)}
        title={isUpload ? 'Replace the uploaded file' : 'Clear this step and start over'}
      >
        {action}
      </button>

      {confirming && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => !resetting && setConfirming(false)}
        >
          <div className="card" style={{ maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ct" style={{ color: 'var(--err)' }}>
              {action} {stepName} — this cannot be undone
            </div>
            <p style={{ fontSize: '.9rem', color: 'var(--tx)', lineHeight: 1.6, margin: '8px 0 12px' }}>
              {isUpload
                ? `The currently uploaded ${stepName} file will be permanently deleted from this patient's record. You can then upload a new version.`
                : `The submitted ${stepName} data will be permanently cleared and the form will return to its empty state.`}
            </p>
            <p style={{ fontSize: '.85rem', color: 'var(--tx2)', lineHeight: 1.6, marginBottom: 16 }}>
              This action is logged in the audit trail. For IRB-bound data,
              consider whether a correction is more appropriate than a reset.
            </p>
            {err && <div className="al al-err mb12">{err}</div>}
            <div className="fc gap8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-bd" onClick={() => setConfirming(false)} disabled={resetting}>
                Cancel
              </button>
              <button className="btn btn-err" onClick={doReset} disabled={resetting}>
                {resetting ? `${action.slice(0, -1)}ing…` : action}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
