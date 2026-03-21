import { useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { StepRepo } from '../../storage/repository.js';
import { STEP_KEYS } from '../../constants/index.js';
import ShipmentPipeline from './ShipmentPipeline.jsx';

function getWorkflowStats(patients) {
  const stats = { consent: 0, questionnaire: 0, collection: 0, pbmc: 0, transfer: 0, fullyComplete: 0 };
  patients.forEach((p) => {
    const steps = {
      consent: StepRepo.getConsent(p.id)?.submitted,
      questionnaire: StepRepo.getQuestionnaire(p.id)?.submitted,
      collection: StepRepo.getCollection(p.id)?.submitted,
      pbmc: StepRepo.getPbmc(p.id)?.submitted,
      transfer: StepRepo.getTransfer(p.id)?.submitted,
    };
    STEP_KEYS.forEach((k) => { if (steps[k]) stats[k]++; });
    if (STEP_KEYS.every((k) => steps[k])) stats.fullyComplete++;
  });
  return stats;
}

export default function Dashboard({ onViewPatient }) {
  const { patients, users, t, user } = useApp();

  const onTx = patients.filter((p) => p.treatment === 'On Treatment').length;
  const sites = [...new Set(patients.map((p) => p.facility))].length;
  const byType = patients.reduce((a, p) => { a[p.leukemiaType] = (a[p.leukemiaType] || 0) + 1; return a; }, {});
  const byFac = patients.reduce((a, p) => { a[p.facility] = (a[p.facility] || 0) + 1; return a; }, {});
  const recent = [...patients].sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)).slice(0, 5);

  const wf = useMemo(() => getWorkflowStats(patients), [patients]);

  const avgAge = patients.length > 0
    ? Math.round(patients.reduce((s, p) => s + (parseInt(p.age, 10) || 0), 0) / patients.length)
    : 0;

  return (
    <div className="fade">
      <div className="ph">{t.dash.title}</div>
      <div className="ps">Leukemia Omics Research &middot; National Reference Laboratory, Rwanda</div>

      <div className="stat-grid">
        {[
          { n: patients.length, l: t.dash.total, c: 'var(--tx)' },
          { n: onTx, l: t.dash.onTx, c: 'var(--ok)' },
          { n: sites, l: t.dash.sites, c: 'var(--ac)' },
          { n: users.length, l: t.dash.users, c: 'var(--viewer-c)' },
        ].map((s, i) => (
          <div className="stat" key={i}>
            <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Workflow completion overview */}
      {patients.length > 0 && (
        <div className="card">
          <div className="ct">{t.dash.workflow || 'Workflow Progress'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {STEP_KEYS.map((k) => {
              const pct = patients.length > 0 ? Math.round((wf[k] / patients.length) * 100) : 0;
              return (
                <div key={k} style={{ padding: '10px 12px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: '.78rem', color: 'var(--tx2)', marginBottom: 4 }}>{t.steps[k]}</div>
                  <div className="fc gap6">
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: pct === 100 ? 'var(--ok)' : 'var(--tx)' }}>{pct}%</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--tx3)' }}>{wf[k]}/{patients.length}</span>
                  </div>
                  <div className="prog" style={{ marginTop: 6 }}>
                    <div className={`pfill ${pct === 100 ? 'ok' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fc gap8">
            <span className="badge b-ok">{wf.fullyComplete} {t.dash.complete || 'fully complete'}</span>
            <span className="badge b-muted">{patients.length - wf.fullyComplete} {t.dash.inProgress || 'in progress'}</span>
          </div>
        </div>
      )}

      <div className="g2">
        <div className="card">
          <div className="ct">{t.dash.byType}</div>
          {Object.entries(byType).length === 0
            ? <div style={{ color: 'var(--tx2)', fontSize: '.85rem' }}>&mdash;</div>
            : Object.entries(byType).map(([k, v]) => (
              <div key={k} className="mb12">
                <div className="fb" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{k}</span>
                  <span className="badge b-ac">{v}</span>
                </div>
                <div className="prog">
                  <div className="pfill" style={{ width: `${(v / patients.length) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
        <div className="card">
          <div className="ct">{t.dash.byFac}</div>
          {Object.entries(byFac).length === 0
            ? <div style={{ color: 'var(--tx2)', fontSize: '.85rem' }}>&mdash;</div>
            : Object.entries(byFac).map(([k, v]) => (
              <div key={k} className="mb12">
                <div className="fb" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{k}</span>
                  <span className="badge b-muted">{v}</span>
                </div>
                <div className="prog">
                  <div className="pfill ok" style={{ width: `${(v / patients.length) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Demographics quick stats */}
      {patients.length > 0 && (
        <div className="g2">
          <div className="card">
            <div className="ct">{t.dash.demographics || 'Demographics'}</div>
            <div className="fb mb8">
              <span style={{ fontSize: '.85rem', color: 'var(--tx2)' }}>{t.dash.avgAge || 'Average Age'}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{avgAge} yrs</span>
            </div>
            <div className="fb">
              <span style={{ fontSize: '.85rem', color: 'var(--tx2)' }}>{t.pt.onTx}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ok)' }}>{onTx} / {patients.length}</span>
            </div>
          </div>
          <div className="card">
            <div className="ct">{t.dash.collections || 'Sample Collection'}</div>
            <div className="fb mb8">
              <span style={{ fontSize: '.85rem', color: 'var(--tx2)' }}>{t.dash.collected || 'Samples Collected'}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ac)' }}>{wf.collection}</span>
            </div>
            <div className="fb">
              <span style={{ fontSize: '.85rem', color: 'var(--tx2)' }}>{t.dash.transferred || 'Transferred'}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liege-c)' }}>{wf.transfer}</span>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'liege' && (
        <ShipmentPipeline onViewPatient={onViewPatient} />
      )}

      {recent.length > 0 && (
        <div className="card">
          <div className="ct">{t.dash.recent}</div>
          {recent.map((p) => (
            <div
              className="ptrow"
              key={p.id}
              style={{ marginBottom: 8 }}
              onClick={() => onViewPatient(p)}
            >
              <div>
                <div className="fc gap6 mb6">
                  <span className="code-pill">{p.code}</span>
                  <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}</span>
                </div>
                <div className="pt-meta">{p.facility} &middot; {p.enrolledAt?.split('T')[0]}</div>
              </div>
              <span className="badge b-ac">{p.leukemiaType}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
