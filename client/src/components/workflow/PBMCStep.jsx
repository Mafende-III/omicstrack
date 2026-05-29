import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import { SITES } from '../../constants/index.js';
import ResetStepButton from '../common/ResetStepButton.jsx';

const DEFAULTS = {
  location: '', dateTime: '', cellCount: '', viability: '', concentration: '', vials: '',
  storage: { site: '', fridge: '', shelf: '', box: '' },
  labResultFile: null, labResultFileName: null,
  submitted: false, submittedAt: null, submittedBy: null,
};
const MAX_LAB_FILE_MB = 5;

function compressImage(dataUrl, maxWidth = 1600) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function PBMCStep({ patientId, readOnly, onComplete }) {
  const { t, user, users } = useApp();
  const { data, update, save, submit, flash, resetLocal } = useStepData(patientId, 'pbmc', DEFAULTS);
  const [showDetails, setShowDetails] = useState(false);
  const [fileErr, setFileErr] = useState('');

  const updS = (v) => update({ storage: { ...data.storage, ...v } });

  const handleLabFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileErr('');
    if (f.size > MAX_LAB_FILE_MB * 1024 * 1024) {
      setFileErr(`File too large (max ${MAX_LAB_FILE_MB}MB)`);
      return;
    }
    const rd = new FileReader();
    rd.onload = async (ev) => {
      let result = ev.target.result;
      if (f.type.startsWith('image/') && result.length > 600_000) {
        result = await compressImage(result);
      }
      update({ labResultFile: result, labResultFileName: f.name });
    };
    rd.readAsDataURL(f);
  };

  const clearLabFile = () => update({ labResultFile: null, labResultFileName: null });

  const doSubmit = async () => {
    await submit(user?.id, user?.name);
    onComplete?.();
  };

  const submitter = data.submittedBy ? users.find((u) => u.id === data.submittedBy)?.name : null;
  const stor = data.storage || {};

  if (data.submitted) {
    return (
      <div className="fade">
        <div className="al al-ok fc gap8" style={{ justifyContent: 'space-between' }}>
          <span>&#10003; {t.pbmc.done}</span>
          <div className="fc gap6">
            <button className="btn btn-bd btn-sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Hide' : 'View'} Details
            </button>
            <ResetStepButton
              patientId={patientId}
              step="pbmc"
              onReset={() => { resetLocal(); onComplete?.(); }}
            />
          </div>
        </div>
        {showDetails && (
          <div className="slide-up">
            <div className="card">
              <div className="ct">{t.pbmc.title}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginBottom: 16 }}>
                {data.submittedAt && <span>Submitted: {data.submittedAt.split('T')[0]}</span>}
                {submitter && <span> &middot; By: {submitter}</span>}
              </div>
              <div className="g2 mb12">
                {[
                  { l: t.pbmc.loc, v: data.location },
                  { l: t.pbmc.dt, v: data.dateTime?.replace('T', ' ') },
                  { l: t.pbmc.cc, v: data.cellCount },
                  { l: t.pbmc.via, v: data.viability ? `${data.viability}%` : '' },
                  { l: t.pbmc.conc, v: data.concentration },
                  { l: t.pbmc.vials, v: data.vials },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
                    <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{item.l}</div>
                    <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--tx)' }}>{item.v || '\u2014'}</div>
                  </div>
                ))}
              </div>
              {data.labResultFile && (
                <div className="card-inner" style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 8, color: 'var(--ac)' }}>&#10064; Lab result</div>
                  <a
                    href={data.labResultFile}
                    download={data.labResultFileName || 'lab-result'}
                    className="btn btn-bd btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    &#11015; Download {data.labResultFileName || 'lab-result'}
                  </a>
                </div>
              )}

              {/* Storage location visual */}
              <div className="card-inner">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 12, color: 'var(--ac)' }}>&#10064; {t.pbmc.storTitle}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { l: t.pbmc.site, v: stor.site },
                    { l: t.pbmc.fridge, v: stor.fridge },
                    { l: t.pbmc.shelf, v: stor.shelf },
                    { l: t.pbmc.box, v: stor.box },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '8px', background: 'var(--s1)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                      <div style={{ fontSize: '.68rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>{item.l}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: item.v ? 'var(--tx)' : 'var(--tx3)' }}>{item.v || '\u2014'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade">
      <div className="card">
        <div className="ct">{t.pbmc.title}</div>
        <div className="g2 mb8">
          <div className="f">
            <label className="lbl">{t.pbmc.loc}</label>
            <select className="sel" value={data.location} onChange={(e) => update({ location: e.target.value })} disabled={readOnly}>
              <option value="">&mdash;</option>
              {[...SITES, 'NRL'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="f"><label className="lbl">{t.pbmc.dt}</label><input type="datetime-local" className="inp" value={data.dateTime} onChange={(e) => update({ dateTime: e.target.value })} disabled={readOnly} /></div>
          <div className="f"><label className="lbl">{t.pbmc.cc}</label><input type="text" className="inp" value={data.cellCount} onChange={(e) => update({ cellCount: e.target.value })} disabled={readOnly} /></div>
          <div className="f"><label className="lbl">{t.pbmc.via}</label><input type="number" className="inp" value={data.viability} onChange={(e) => update({ viability: e.target.value })} disabled={readOnly} /></div>
          <div className="f"><label className="lbl">{t.pbmc.conc}</label><input type="text" className="inp" value={data.concentration} onChange={(e) => update({ concentration: e.target.value })} disabled={readOnly} /></div>
          <div className="f"><label className="lbl">{t.pbmc.vials} <span style={{ color: 'var(--tx3)', textTransform: 'none', fontWeight: 400 }}>({t.pbmc.vialsH})</span></label><input type="number" className="inp" value={data.vials} onChange={(e) => update({ vials: e.target.value })} disabled={readOnly} /></div>
        </div>
        {!readOnly && (
          <div className="card-inner" style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 4 }}>&#10064; Lab result (optional)</div>
            <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginBottom: 10 }}>
              Upload the hematology printout or analyzer report (PDF or image, max {MAX_LAB_FILE_MB}MB).
            </div>
            {data.labResultFile ? (
              <div className="fc gap8">
                <a
                  href={data.labResultFile}
                  download={data.labResultFileName || 'lab-result'}
                  className="btn btn-bd btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  &#11015; {data.labResultFileName || 'lab-result'}
                </a>
                <button type="button" className="btn btn-bd btn-sm" onClick={clearLabFile}>Remove</button>
              </div>
            ) : (
              <input type="file" accept="image/*,application/pdf" onChange={handleLabFile} />
            )}
            {fileErr && <div style={{ color: 'var(--err)', fontSize: '.78rem', marginTop: 6 }}>{fileErr}</div>}
          </div>
        )}
        <div className="card-inner">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>&#10064; {t.pbmc.storTitle}</div>
          <div className="g2">
            <div className="f"><label className="lbl">{t.pbmc.site}</label><input className="inp" value={data.storage.site} onChange={(e) => updS({ site: e.target.value })} disabled={readOnly} /></div>
            <div className="f"><label className="lbl">{t.pbmc.fridge}</label><input className="inp" value={data.storage.fridge} onChange={(e) => updS({ fridge: e.target.value })} disabled={readOnly} /></div>
            <div className="f"><label className="lbl">{t.pbmc.shelf}</label><input className="inp" value={data.storage.shelf} onChange={(e) => updS({ shelf: e.target.value })} disabled={readOnly} /></div>
            <div className="f"><label className="lbl">{t.pbmc.box}</label><input className="inp" value={data.storage.box} onChange={(e) => updS({ box: e.target.value })} disabled={readOnly} /></div>
          </div>
        </div>
        {!readOnly && (
          <div className="fc gap8 mt16" style={{ justifyContent: 'flex-end' }}>
            {flash && <span className="save-flash">&#10003; {t.misc.saveFlash}</span>}
            <button className="btn btn-bd" onClick={() => save()}>{t.pt.save}</button>
            <button className="btn btn-ac" disabled={!data.location || !data.dateTime || !data.cellCount} onClick={doSubmit}>{t.pbmc.submit}</button>
          </div>
        )}
      </div>
    </div>
  );
}
