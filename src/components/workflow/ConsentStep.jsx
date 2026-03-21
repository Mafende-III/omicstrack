import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import SigPad from '../shared/SigPad.jsx';
import FileViewer from '../shared/FileViewer.jsx';

const DEFAULTS = { mode: 'upload', confirmed: false, patientSignature: null, researcherSignature: null, file: null, fileName: '', submitted: false, submittedAt: null, submittedBy: null };

const MAX_FILE_MB = 5;

function compressImage(dataUrl, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function ConsentStep({ patientId, readOnly, onComplete }) {
  const { t, user, users, logAudit } = useApp();
  const { data, update, save, submit, flash } = useStepData(patientId, 'consent', DEFAULTS);
  const fileRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  const [fileErr, setFileErr] = useState('');

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileErr('');
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileErr(`File too large (max ${MAX_FILE_MB}MB)`);
      return;
    }
    const rd = new FileReader();
    rd.onload = async (ev) => {
      let result = ev.target.result;
      if (f.type.startsWith('image/') && result.length > 500_000) {
        result = await compressImage(result);
      }
      update({ file: result, fileName: f.name });
    };
    rd.readAsDataURL(f);
  };

  const doSubmit = () => {
    submit(user?.id, user?.name);
    logAudit('consent.submit', 'consent', patientId, `Consent submitted for patient`);
    onComplete?.();
  };

  const submitter = data.submittedBy ? users.find((u) => u.id === data.submittedBy)?.name : null;

  if (data.submitted) {
    return (
      <div className="fade">
        <div className="al al-ok fc gap8" style={{ justifyContent: 'space-between' }}>
          <span>&#10003; {t.consent.done}</span>
          <button className="btn btn-bd btn-sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide' : 'View'} Details
          </button>
        </div>
        {showDetails && (
          <div className="slide-up">
            <div className="card">
              <div className="ct">{t.consent.title}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--tx2)', marginBottom: 12 }}>
                {data.submittedAt && <span>Submitted: {data.submittedAt.split('T')[0]}</span>}
                {submitter && <span> &middot; By: {submitter}</span>}
              </div>
              {data.mode === 'upload' && data.file && (
                <FileViewer file={data.file} fileName={data.fileName} />
              )}
              {data.mode === 'fill' && (
                <div className="card-inner mb12" style={{ fontSize: '.85rem', color: 'var(--tx2)', lineHeight: 1.8 }}>
                  <strong style={{ color: 'var(--tx)' }}>Study:</strong> Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population<br />
                  <strong style={{ color: 'var(--tx)' }}>PI:</strong> Esperance UMUMARARUNGU &middot; National Reference Laboratory, Rwanda<br />
                  <strong style={{ color: 'var(--tx)' }}>Ethics:</strong> CMHS IRB + CHUK Ethics Committee
                </div>
              )}
              {data.confirmed && <div className="badge b-ok mb12">&#10003; Confirmed</div>}
            </div>
            {data.patientSignature && (
              <div className="card">
                <div className="ct">{t.consent.pSig}</div>
                <div className="sig-wrap" style={{ padding: 8 }}>
                  <img src={data.patientSignature} alt="Patient signature" style={{ maxWidth: '100%', maxHeight: 120 }} />
                </div>
                <div className="badge b-ok mt8">&#10003; {t.consent.saved}</div>
              </div>
            )}
            {data.researcherSignature && (
              <div className="card">
                <div className="ct">{t.consent.rSig}</div>
                <div className="sig-wrap" style={{ padding: 8 }}>
                  <img src={data.researcherSignature} alt="Researcher signature" style={{ maxWidth: '100%', maxHeight: 120 }} />
                </div>
                <div className="badge b-ok mt8">&#10003; {t.consent.saved}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade">
      {!readOnly && (
        <div className="tog">
          <button className={`tog-o ${data.mode === 'upload' ? 'on' : ''}`} onClick={() => update({ mode: 'upload' })}>{t.consent.upload}</button>
          <button className={`tog-o ${data.mode === 'fill' ? 'on' : ''}`} onClick={() => update({ mode: 'fill' })}>{t.consent.fill}</button>
        </div>
      )}

      {data.mode === 'upload' ? (
        <div className="card">
          <div className="ct">{t.consent.title}</div>
          {!readOnly && (
            <>
              {fileErr && <div className="al al-err mb8">{fileErr}</div>}
              <div className="upzone" onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: '1.6rem', color: 'var(--tx3)' }}>&#128196;</div>
                <div className="upzone-txt">{t.consent.instr}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--tx3)', marginTop: 4 }}>Max {MAX_FILE_MB}MB</div>
                <button className="btn btn-bd btn-sm" style={{ marginTop: 10 }}>{t.consent.choose}</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
            </>
          )}
          {data.file && <FileViewer file={data.file} fileName={data.fileName} />}
          {!readOnly && (
            <label className="cbox mt16">
              <input type="checkbox" checked={data.confirmed} onChange={(e) => update({ confirmed: e.target.checked })} />
              <span className="cbox-lbl">{t.consent.confirm}</span>
            </label>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="ct">{t.consent.title}</div>
          <div className="card-inner mb16" style={{ fontSize: '.85rem', color: 'var(--tx2)', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--tx)' }}>Study:</strong> Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population<br />
            <strong style={{ color: 'var(--tx)' }}>PI:</strong> Esperance UMUMARARUNGU &middot; National Reference Laboratory, Rwanda<br />
            <strong style={{ color: 'var(--tx)' }}>Ethics:</strong> CMHS IRB + CHUK Ethics Committee<br /><br />
            I have been provided all required information and understand my role in this study. I understand I can withdraw at any time without consequences. I consent to participate.
          </div>
          {!readOnly && (
            <label className="cbox mb16">
              <input type="checkbox" checked={data.confirmed} onChange={(e) => update({ confirmed: e.target.checked })} />
              <span className="cbox-lbl">{t.consent.confirm}</span>
            </label>
          )}
        </div>
      )}

      <div className="card">
        <div className="ct">{t.consent.pSig}</div>
        <SigPad onCapture={(v) => update({ patientSignature: v })} existing={data.patientSignature} readOnly={readOnly} t={t} />
        {data.patientSignature && <div className="badge b-ok mt8">&#10003; {t.consent.saved}</div>}
      </div>

      <div className="card">
        <div className="ct">{t.consent.rSig}</div>
        <SigPad onCapture={(v) => update({ researcherSignature: v })} existing={data.researcherSignature} readOnly={readOnly} t={t} />
        {data.researcherSignature && <div className="badge b-ok mt8">&#10003; {t.consent.saved}</div>}
      </div>

      {!readOnly && (
        <div className="fc gap8" style={{ justifyContent: 'flex-end', marginBottom: 20 }}>
          {flash && <span className="save-flash">&#10003; {t.misc.saveFlash}</span>}
          <button className="btn btn-bd" onClick={() => save()}>{t.pt.save}</button>
          <button className="btn btn-ac" disabled={!data.confirmed} onClick={doSubmit}>{t.consent.submit}</button>
        </div>
      )}
    </div>
  );
}
