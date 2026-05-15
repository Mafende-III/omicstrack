import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import { api } from '../../storage/engine.js';
import { CONSENT_TEMPLATE as STATIC_CONSENT_TEMPLATE } from '../../constants/consentTemplate.js';
import SigPad from '../shared/SigPad.jsx';
import FileViewer from '../shared/FileViewer.jsx';

const DEFAULTS = {
  mode: 'fill',
  confirmed: false,
  patientSignature: null,
  researcherSignature: null,
  file: null,
  fileName: '',
  submitted: false,
  submittedAt: null,
  submittedBy: null,
};

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
  const { t, lang, user, users, patients, consentTemplate } = useApp();
  const langKey = ['en', 'fr', 'ki'].includes(lang) ? lang : 'en';
  // Prefer DB-managed template, fall back to bundled static template if API hasn't loaded yet
  const templateContent = consentTemplate?.content || STATIC_CONSENT_TEMPLATE;
  const tpl = templateContent[langKey] || templateContent.en;
  const { data, update, save, submit, flash } = useStepData(patientId, 'consent', DEFAULTS);
  const fileRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  const [fileErr, setFileErr] = useState('');

  const patient = patients.find((p) => p.id === patientId);
  const participantName = patient?.name || '';
  const researcherName = user?.name || '';
  const facility = patient?.facility || '';
  const todayStr = new Date().toISOString().split('T')[0];

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

  const doSubmit = async () => {
    await submit(user?.id, user?.name, { lang: langKey });
    onComplete?.();
  };

  const submitter = data.submittedBy ? users.find((u) => u.id === data.submittedBy)?.name : null;
  const signedDate = data.submittedAt ? data.submittedAt.split('T')[0] : todayStr;

  const downloadPdf = async () => {
    try {
      const blob = await api.getBlob(`/steps/${patientId}/consent/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent_${patientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF not available
    }
  };

  const canSubmitFill =
    data.mode === 'fill' && data.confirmed && data.patientSignature && data.researcherSignature;
  const canSubmitUpload = data.mode === 'upload' && data.confirmed && data.file;
  const canSubmit = canSubmitFill || canSubmitUpload;

  if (data.submitted) {
    return (
      <div className="fade">
        <div className="al al-ok fc gap8" style={{ justifyContent: 'space-between' }}>
          <div className="fc gap8">
            <span>&#10003; {t.consent.done}</span>
            {data.hasGeneratedPdf && (
              <button className="btn btn-bd btn-sm" onClick={downloadPdf}>
                Download PDF
              </button>
            )}
          </div>
          <button className="btn btn-bd btn-sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide' : 'View'} Details
          </button>
        </div>
        {showDetails && (
          <div className="slide-up">
            <div className="card">
              <div className="ct">{tpl.title}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--tx2)', marginBottom: 12 }}>
                {data.submittedAt && <span>Submitted: {signedDate}</span>}
                {submitter && <span> &middot; By: {submitter}</span>}
              </div>
              {data.mode === 'upload' && data.file && (
                <FileViewer file={data.file} fileName={data.fileName} />
              )}
              {data.mode === 'fill' && (
                <SubmittedDocument
                  tpl={tpl}
                  participantName={participantName}
                  researcherName={submitter || researcherName}
                  facility={facility}
                  signedDate={signedDate}
                  patientSig={data.patientSignature}
                  researcherSig={data.researcherSignature}
                  t={t}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade">
      {!readOnly && (
        <div className="tog">
          <button
            className={`tog-o ${data.mode === 'fill' ? 'on' : ''}`}
            onClick={() => update({ mode: 'fill' })}
          >
            {t.consent.fill}
          </button>
          <button
            className={`tog-o ${data.mode === 'upload' ? 'on' : ''}`}
            onClick={() => update({ mode: 'upload' })}
          >
            {t.consent.upload}
          </button>
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
                <div style={{ fontSize: '.72rem', color: 'var(--tx3)', marginTop: 4 }}>
                  Max {MAX_FILE_MB}MB
                </div>
                <button className="btn btn-bd btn-sm" style={{ marginTop: 10 }}>
                  {t.consent.choose}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
            </>
          )}
          {data.file && <FileViewer file={data.file} fileName={data.fileName} />}
          {!readOnly && (
            <label className="cbox mt16">
              <input
                type="checkbox"
                checked={data.confirmed}
                onChange={(e) => update({ confirmed: e.target.checked })}
              />
              <span className="cbox-lbl">{t.consent.confirm}</span>
            </label>
          )}
        </div>
      ) : (
        <>
          {/* Document body */}
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tx)' }}>
                {tpl.title}
              </div>
              <div
                style={{
                  fontSize: '.82rem',
                  fontWeight: 600,
                  color: 'var(--ac)',
                  marginTop: 6,
                }}
              >
                {tpl.studyTitle}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--bd)', margin: '12px 0' }} />

            {tpl.sections.map((sec) => (
              <div key={sec.key || sec.heading} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: '.86rem',
                    fontWeight: 700,
                    color: 'var(--tx)',
                    marginBottom: 4,
                  }}
                >
                  {sec.heading}
                </div>
                <div
                  style={{
                    fontSize: '.82rem',
                    color: 'var(--tx2)',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {sec.body}
                </div>
              </div>
            ))}
          </div>

          {/* Consent statement + checkbox */}
          <div className="card">
            <div className="ct">Consent</div>
            <div
              style={{
                fontSize: '.85rem',
                color: 'var(--tx2)',
                lineHeight: 1.7,
                marginBottom: 12,
              }}
            >
              {tpl.consentStatement}
            </div>
            {!readOnly && (
              <label className="cbox">
                <input
                  type="checkbox"
                  checked={data.confirmed}
                  onChange={(e) => update({ confirmed: e.target.checked })}
                />
                <span className="cbox-lbl">{t.consent.iAgree}</span>
              </label>
            )}
          </div>

          {/* Signing block — mirrors the docx */}
          <div className="card">
            <div className="ct">{t.consent.signingTitle}</div>

            <SigningRow
              index={1}
              nameLabel={tpl.participantLabel}
              name={participantName}
              sigDateLabel={tpl.signatureAndDate}
              date={signedDate}
              signature={data.patientSignature}
              onCapture={(v) => update({ patientSignature: v })}
              readOnly={readOnly}
              t={t}
            />

            <div style={{ borderTop: '1px dashed var(--bd)', margin: '16px 0' }} />

            <SigningRow
              index={2}
              nameLabel={tpl.researcherLabel}
              name={researcherName}
              sigDateLabel={tpl.signatureAndDate}
              date={signedDate}
              signature={data.researcherSignature}
              onCapture={(v) => update({ researcherSignature: v })}
              readOnly={readOnly}
              t={t}
            />

            <div style={{ borderTop: '1px solid var(--bd)', margin: '16px 0 12px' }} />

            <div style={{ fontSize: '.88rem', color: 'var(--tx)' }}>
              <strong>{tpl.doneAt}:</strong>{' '}
              <span style={{ color: 'var(--tx2)' }}>{facility || '—'}</span>
            </div>
          </div>
        </>
      )}

      {!readOnly && (
        <div className="fc gap8" style={{ justifyContent: 'flex-end', marginBottom: 20 }}>
          {flash && <span className="save-flash">&#10003; {t.misc.saveFlash}</span>}
          <button className="btn btn-bd" onClick={() => save()}>
            {t.pt.save}
          </button>
          <button className="btn btn-ac" disabled={!canSubmit} onClick={doSubmit}>
            {t.consent.submit}
          </button>
        </div>
      )}
    </div>
  );
}

function SigningRow({ index, nameLabel, name, sigDateLabel, date, signature, onCapture, readOnly, t }) {
  return (
    <div>
      <div
        style={{
          fontSize: '.78rem',
          fontWeight: 700,
          color: 'var(--tx3)',
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          marginBottom: 6,
        }}
      >
        {index}. {nameLabel}
      </div>
      <div style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--tx)', marginBottom: 10 }}>
        {name || '—'}
      </div>

      <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginBottom: 4 }}>
        {sigDateLabel}
      </div>
      <SigPad onCapture={onCapture} existing={signature} readOnly={readOnly} t={t} />
      <div style={{ fontSize: '.8rem', color: 'var(--tx2)', marginTop: 6 }}>
        {t.consent.date}: {date}
      </div>
    </div>
  );
}

function SubmittedDocument({ tpl, participantName, researcherName, facility, signedDate, patientSig, researcherSig, t }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tx)' }}>{tpl.title}</div>
        <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--ac)', marginTop: 4 }}>
          {tpl.studyTitle}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bd)', margin: '12px 0' }} />

      {tpl.sections.map((sec) => (
        <div key={sec.key || sec.heading} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: '.85rem',
              fontWeight: 700,
              color: 'var(--tx)',
              marginBottom: 4,
            }}
          >
            {sec.heading}
          </div>
          <div
            style={{
              fontSize: '.8rem',
              color: 'var(--tx2)',
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
            }}
          >
            {sec.body}
          </div>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--bd)', margin: '14px 0' }} />

      <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>
        Consent
      </div>
      <div
        style={{
          fontSize: '.8rem',
          color: 'var(--tx2)',
          lineHeight: 1.7,
          marginBottom: 16,
        }}
      >
        {tpl.consentStatement}
      </div>

      <SubmittedSigRow
        index={1}
        nameLabel={tpl.participantLabel}
        name={participantName}
        sigDateLabel={tpl.signatureAndDate}
        date={signedDate}
        signature={patientSig}
      />

      <div style={{ borderTop: '1px dashed var(--bd)', margin: '14px 0' }} />

      <SubmittedSigRow
        index={2}
        nameLabel={tpl.researcherLabel}
        name={researcherName}
        sigDateLabel={tpl.signatureAndDate}
        date={signedDate}
        signature={researcherSig}
      />

      <div style={{ borderTop: '1px solid var(--bd)', margin: '14px 0 10px' }} />

      <div style={{ fontSize: '.88rem', color: 'var(--tx)' }}>
        <strong>{tpl.doneAt}:</strong>{' '}
        <span style={{ color: 'var(--tx2)' }}>{facility || '—'}</span>
      </div>
    </div>
  );
}

function SubmittedSigRow({ index, nameLabel, name, sigDateLabel, date, signature }) {
  return (
    <div>
      <div
        style={{
          fontSize: '.78rem',
          fontWeight: 700,
          color: 'var(--tx3)',
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          marginBottom: 4,
        }}
      >
        {index}. {nameLabel}
      </div>
      <div style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--tx)', marginBottom: 8 }}>
        {name || '—'}
      </div>
      <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginBottom: 4 }}>
        {sigDateLabel}
      </div>
      {signature ? (
        <div className="sig-wrap" style={{ padding: 8 }}>
          <img
            src={signature}
            alt="signature"
            style={{ maxWidth: '100%', maxHeight: 120 }}
          />
        </div>
      ) : (
        <div style={{ fontSize: '.85rem', color: 'var(--tx3)', fontStyle: 'italic' }}>
          (no signature captured)
        </div>
      )}
      <div style={{ fontSize: '.8rem', color: 'var(--tx2)', marginTop: 6 }}>
        Date: {date}
      </div>
    </div>
  );
}
