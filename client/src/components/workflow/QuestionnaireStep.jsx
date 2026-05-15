import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import { api } from '../../storage/engine.js';
import { QF } from '../../constants/questionnaire.js';
import FileViewer from '../shared/FileViewer.jsx';

// Normalize either the DB template content or the bundled QF static module
// into a single runtime shape: [{ key, label, fields: [{ id, type, label, options }] }, ...]
function buildSections(template, lang, fallbackSecLabels) {
  if (template?.sections?.length) {
    return template.sections.map((sec) => ({
      key: sec.key,
      label: sec.labels?.[lang] || sec.labels?.en || sec.key,
      fields: sec.fields.map((f) => ({
        id: f.id,
        type: f.type || 'text',
        label: f.labels?.[lang] || f.labels?.en || f.id,
        options: f.options || [],
      })),
    }));
  }
  return Object.keys(QF).map((key) => ({
    key,
    label: fallbackSecLabels?.[key] || key,
    fields: QF[key].map((f) => ({
      id: f.id,
      type: f.type || 'text',
      label: f[lang] || f.en,
      options: f.opts || [],
    })),
  }));
}

const DEFAULTS = { mode: 'upload', fields: {}, sectionsDone: {}, file: null, fileName: '', submitted: false, submittedAt: null, submittedBy: null };
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

export default function QuestionnaireStep({ patientId, readOnly, onComplete }) {
  const { t, lang, user, users, questionnaireTemplate } = useApp();
  const langKey = ['en', 'fr', 'ki'].includes(lang) ? lang : 'en';
  const sections = buildSections(questionnaireTemplate?.content, langKey, t.qsec);

  const { data, update, save, submit, flash } = useStepData(patientId, 'questionnaire', DEFAULTS);
  const initialOpen = sections.reduce((acc, s, i) => ({ ...acc, [s.key]: i === 0 }), {});
  const [open, setOpen] = useState(initialOpen);
  const [showDetails, setShowDetails] = useState(false);
  const [fileErr, setFileErr] = useState('');
  const fileRef = useRef(null);

  const updF = (id, val) => update({ fields: { ...data.fields, [id]: val } });
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
  const done = Object.keys(data.sectionsDone).filter((k) => data.sectionsDone[k]).length;
  const totalSections = sections.length;

  const doSubmit = async () => {
    await submit(user?.id, user?.name);
    onComplete?.();
  };

  const submitter = data.submittedBy ? users.find((u) => u.id === data.submittedBy)?.name : null;

  const downloadPdf = async () => {
    try {
      const blob = await api.getBlob(`/steps/${patientId}/questionnaire/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questionnaire_${patientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF not available
    }
  };

  if (data.submitted) {
    return (
      <div className="fade">
        <div className="al al-ok fc gap8" style={{ justifyContent: 'space-between' }}>
          <div className="fc gap8">
            <span>&#10003; {t.q.done}</span>
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
              <div className="ct">{t.q.title}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginBottom: 12 }}>
                {data.submittedAt && <span>Submitted: {data.submittedAt.split('T')[0]}</span>}
                {submitter && <span> &middot; By: {submitter}</span>}
              </div>
              <div className="fc gap6 mb12" style={{ flexWrap: 'wrap' }}>
                {sections.map((s) => (
                  <span key={s.key} className={`badge ${data.sectionsDone[s.key] ? 'b-ok' : 'b-muted'}`}>
                    {data.sectionsDone[s.key] ? '\u2713 ' : ''}{s.label}
                  </span>
                ))}
              </div>
              {data.file && <FileViewer file={data.file} fileName={data.fileName} />}
            </div>
            {/* Show filled data in read-only */}
            {data.mode === 'fill' && Object.keys(data.fields).length > 0 && (
              <>
                {sections.map((s) => (
                  <div className="acc" key={s.key}>
                    <div className="acc-h" onClick={() => setOpen((p) => ({ ...p, [s.key]: !p[s.key] }))}>
                      <span className="acc-t">{s.label}</span>
                      <div className="fc gap8">
                        {data.sectionsDone[s.key] ? <span className="badge b-ok">&#10003;</span> : <span className="badge b-muted">&mdash;</span>}
                        <span style={{ color: 'var(--tx3)', fontSize: '.78rem' }}>{open[s.key] ? '\u25B2' : '\u25BC'}</span>
                      </div>
                    </div>
                    {open[s.key] && (
                      <div className="acc-b">
                        {s.fields.map((f) => {
                          const val = data.fields[f.id];
                          if (!val) return null;
                          return (
                            <div key={f.id} className="mb8">
                              <div style={{ fontSize: '.75rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{f.label}</div>
                              <div style={{ fontSize: '.88rem', color: 'var(--tx)', padding: '4px 0' }}>{val}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </>
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
          <button className={`tog-o ${data.mode === 'upload' ? 'on' : ''}`} onClick={() => update({ mode: 'upload' })}>{t.q.upload}</button>
          <button className={`tog-o ${data.mode === 'fill' ? 'on' : ''}`} onClick={() => update({ mode: 'fill' })}>{t.q.fill}</button>
        </div>
      )}

      <div className="card-flat mb12">
        <div className="fb mb8">
          <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--tx2)' }}>{t.q.progress}</span>
          <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--ac)' }}>{done}/{totalSections}</span>
        </div>
        <div className="prog"><div className="pfill" style={{ width: `${totalSections ? (done / totalSections) * 100 : 0}%` }} /></div>
        <div className="fc gap6 mt12" style={{ flexWrap: 'wrap' }}>
          {sections.map((s) => (
            <span key={s.key} className={`badge ${data.sectionsDone[s.key] ? 'b-ok' : 'b-muted'}`}>
              {data.sectionsDone[s.key] ? '\u2713 ' : ''}{s.key}
            </span>
          ))}
        </div>
      </div>

      {data.mode === 'upload' ? (
        <div className="card">
          <div className="ct">{t.q.upload}</div>
          {!readOnly && (
            <>
              {fileErr && <div className="al al-err mb8">{fileErr}</div>}
              <div className="upzone" onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: '1.6rem', color: 'var(--tx3)' }}>&#128196;</div>
                <div className="upzone-txt">{t.q.instr}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--tx3)', marginTop: 4 }}>Max {MAX_FILE_MB}MB</div>
                <button className="btn btn-bd btn-sm" style={{ marginTop: 10 }}>{t.q.choose}</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
            </>
          )}
          {data.file && <FileViewer file={data.file} fileName={data.fileName} />}
          <hr className="divider" />
          <div className="ct" style={{ marginBottom: 10 }}>{t.q.confirmSec}</div>
          {sections.map((s) => (
            <div key={s.key} className="fc gap8 mb8">
              {!readOnly
                ? <input type="checkbox" checked={!!data.sectionsDone[s.key]} onChange={(e) => update({ sectionsDone: { ...data.sectionsDone, [s.key]: e.target.checked } })} style={{ accentColor: 'var(--ac)' }} />
                : <span className={`dot-${data.sectionsDone[s.key] ? 'ok' : 'muted'}`} />}
              <span style={{ fontSize: '.88rem', color: data.sectionsDone[s.key] ? 'var(--tx)' : 'var(--tx2)' }}>{s.label}</span>
              {data.sectionsDone[s.key] && <span className="badge b-ok">&#10003;</span>}
            </div>
          ))}
        </div>
      ) : (
        <>
          {sections.map((s) => (
            <div className="acc" key={s.key}>
              <div className="acc-h" onClick={() => setOpen((p) => ({ ...p, [s.key]: !p[s.key] }))}>
                <span className="acc-t">{s.label}</span>
                <div className="fc gap8">
                  {data.sectionsDone[s.key] ? <span className="badge b-ok">&#10003;</span> : <span className="badge b-muted">&mdash;</span>}
                  <span style={{ color: 'var(--tx3)', fontSize: '.78rem' }}>{open[s.key] ? '\u25B2' : '\u25BC'}</span>
                </div>
              </div>
              {open[s.key] && (
                <div className="acc-b">
                  {s.fields.map((f) => (
                    <div className="f" key={f.id}>
                      <label className="lbl">{f.label}</label>
                      {f.type === 'select'
                        ? <select className="sel" value={data.fields[f.id] || ''} onChange={(e) => updF(f.id, e.target.value)} disabled={readOnly}><option value="">&mdash;</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
                        : f.type === 'textarea'
                          ? <textarea className="tea" value={data.fields[f.id] || ''} onChange={(e) => updF(f.id, e.target.value)} disabled={readOnly} />
                          : <input type={f.type} className="inp" value={data.fields[f.id] || ''} onChange={(e) => updF(f.id, e.target.value)} disabled={readOnly} />}
                    </div>
                  ))}
                  {!readOnly && (
                    <label className="cbox mt8">
                      <input type="checkbox" checked={!!data.sectionsDone[s.key]} onChange={(e) => update({ sectionsDone: { ...data.sectionsDone, [s.key]: e.target.checked } })} />
                      <span className="cbox-lbl">{t.q.confirmSec}</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {!readOnly && (
        <div className="fc gap8" style={{ justifyContent: 'flex-end', marginBottom: 20, marginTop: 8 }}>
          {flash && <span className="save-flash">&#10003; {t.misc.saveFlash}</span>}
          <button className="btn btn-bd" onClick={() => save()}>{t.pt.save}</button>
          <button className="btn btn-ac" onClick={doSubmit}>{t.q.submit}</button>
        </div>
      )}
    </div>
  );
}
