import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import { LK_TYPES } from '../../constants/index.js';

const DEFAULTS = { dateTime: '', leukemiaType: '', tubesConfirmed: false, submitted: false, submittedAt: null, submittedBy: null };

export default function CollectionStep({ patientId, patient, readOnly, onComplete }) {
  const { t, user, users, logAudit } = useApp();
  const defaults = { ...DEFAULTS, leukemiaType: patient?.leukemiaType || '' };
  const { data, update, save, submit, flash } = useStepData(patientId, 'collection', defaults);
  const [showDetails, setShowDetails] = useState(false);

  const doSubmit = () => {
    submit(user?.id, user?.name);
    logAudit('collection.submit', 'collection', patientId, 'Collection saved');
    onComplete?.();
  };

  const submitter = data.submittedBy ? users.find((u) => u.id === data.submittedBy)?.name : null;

  if (data.submitted) {
    return (
      <div className="fade">
        <div className="al al-ok fc gap8" style={{ justifyContent: 'space-between' }}>
          <span>&#10003; {t.col.done}</span>
          <button className="btn btn-bd btn-sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide' : 'View'} Details
          </button>
        </div>
        {showDetails && (
          <div className="slide-up">
            <div className="card">
              <div className="ct">{t.col.title}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginBottom: 16 }}>
                {data.submittedAt && <span>Submitted: {data.submittedAt.split('T')[0]}</span>}
                {submitter && <span> &middot; By: {submitter}</span>}
              </div>
              <div className="g2 mb12">
                {[
                  { l: t.col.dt, v: data.dateTime?.replace('T', ' ') },
                  { l: t.col.lkType, v: data.leukemiaType },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
                    <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{item.l}</div>
                    <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--tx)' }}>{item.v || '\u2014'}</div>
                  </div>
                ))}
              </div>
              {/* Tubes visual */}
              <div className="card-inner">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 12, color: 'var(--ac)' }}>&#10064; {t.col.tubes}</div>
                <div className="fc gap10">
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{
                      background: 'var(--s1)',
                      border: `2px solid ${data.tubesConfirmed ? 'var(--ok)' : 'var(--bd)'}`,
                      borderRadius: 8, padding: '10px 14px', flex: 1, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '.72rem', color: 'var(--tx2)', fontWeight: 600 }}>TUBE {n}</div>
                      <div style={{ fontSize: '.68rem', color: data.tubesConfirmed ? 'var(--ok)' : 'var(--tx3)', marginTop: 3 }}>EDTA</div>
                    </div>
                  ))}
                </div>
                {data.tubesConfirmed && <div className="badge b-ok mt8">&#10003; 3 tubes confirmed</div>}
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
        <div className="ct">{t.col.title}</div>
        <div className="g2">
          <div className="f">
            <label className="lbl">{t.col.dt}</label>
            <input type="datetime-local" className="inp" value={data.dateTime} onChange={(e) => update({ dateTime: e.target.value })} disabled={readOnly} />
          </div>
          <div className="f">
            <label className="lbl">{t.col.lkType}</label>
            <select className="sel" value={data.leukemiaType} onChange={(e) => update({ leukemiaType: e.target.value })} disabled={readOnly}>
              <option value="">&mdash;</option>
              {LK_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="card-inner">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.82rem', marginBottom: 12 }}>{t.col.tubes}</div>
          <div className="fc gap10">
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                background: 'var(--s1)',
                border: `2px solid ${data.tubesConfirmed ? 'var(--ok)' : 'var(--bd)'}`,
                borderRadius: 8, padding: '10px 14px', flex: 1, textAlign: 'center', transition: 'border .2s',
              }}>
                <div style={{ fontSize: '.72rem', color: 'var(--tx2)', fontWeight: 600 }}>TUBE {n}</div>
                <div style={{ fontSize: '.68rem', color: data.tubesConfirmed ? 'var(--ok)' : 'var(--tx3)', marginTop: 3 }}>EDTA</div>
              </div>
            ))}
          </div>
          {!readOnly && (
            <label className="cbox mt12">
              <input type="checkbox" checked={data.tubesConfirmed} onChange={(e) => update({ tubesConfirmed: e.target.checked })} />
              <span className="cbox-lbl">{t.col.tubesLbl}</span>
            </label>
          )}
          {data.tubesConfirmed && <div className="badge b-ok mt8">&#10003; 3 tubes confirmed</div>}
        </div>
        {!readOnly && (
          <div className="fc gap8 mt16" style={{ justifyContent: 'flex-end' }}>
            {flash && <span className="save-flash">&#10003; {t.misc.saveFlash}</span>}
            <button className="btn btn-bd" onClick={() => save()}>{t.pt.save}</button>
            <button className="btn btn-ac" disabled={!data.dateTime || !data.tubesConfirmed} onClick={doSubmit}>{t.col.submit}</button>
          </div>
        )}
      </div>
    </div>
  );
}
