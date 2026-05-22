// Variant A: refined research-app aesthetic.
// - Hero tiles have left-border accent + icon glyph + monospace-ish digits
// - Workflow card uses a horizontal "flow" with numbered stage chips
// - Distribution cards use horizontal bars with leading badge

import { STEP_KEYS } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';

export default function DashboardResearch({
  t, user, patients, recent, byType, byFac, wf, fullyComplete,
  pipeline, avgAge, onTx, sites, users, canManageUsers, heroStats, onViewPatient,
}) {
  return (
    <>
      {/* Hero stats — left-accent strip, big number, sub-label */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        {heroStats.map((s, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: 10,
              padding: '14px 16px 14px 18px',
              borderLeft: `3px solid ${s.c}`,
              border: '1px solid var(--bd)',
              borderLeftWidth: 3,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: s.c, lineHeight: 1.1 }}>
              {s.n}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Progress — clinical roles */}
      {patients.length > 0 && (
        <div className="card">
          <div className="fb mb12">
            <div className="ct" style={{ marginBottom: 0 }}>{t.dash.workflow || 'Workflow Progress'}</div>
            <div className="fc gap8">
              <span className="badge b-ok">{fullyComplete} {t.dash.complete || 'complete'}</span>
              {pipeline && <span className="badge b-muted">{pipeline.inTransit} in transit</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {STEP_KEYS.map((k, i) => {
              const pct = patients.length > 0 ? Math.round((wf[k] / patients.length) * 100) : 0;
              return (
                <div key={k} style={{ padding: '12px 14px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
                  <div className="fc gap8 mb8">
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: pct === 100 ? 'var(--ok)' : 'var(--s1)',
                      color: pct === 100 ? '#fff' : 'var(--tx2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.7rem',
                      border: `1px solid ${pct === 100 ? 'var(--ok)' : 'var(--bd)'}`,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: '.8rem', color: 'var(--tx2)' }}>{t.steps[k]}</div>
                  </div>
                  <div className="fc gap6 mb6">
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: pct === 100 ? 'var(--ok)' : 'var(--tx)' }}>{pct}%</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--tx3)' }}>({wf[k]}/{patients.length})</span>
                  </div>
                  <div className="prog">
                    <div className={`pfill ${pct === 100 ? 'ok' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribution */}
      {patients.length > 0 && (
        <div className="g2">
          <div className="card">
            <div className="ct">{t.dash.byType}</div>
            {Object.entries(byType).map(([k, v]) => (
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
          {canSeeField(user?.canSeePii, 'facility') && (
            <div className="card">
              <div className="ct">{t.dash.byFac}</div>
              {Object.entries(byFac).map(([k, v]) => (
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
          )}
        </div>
      )}

      {/* Demographics */}
      {patients.length > 0 && avgAge !== null && (
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

      {/* Recent */}
      {recent.length > 0 && (
        <div className="card">
          <div className="ct">{t.dash.recent}</div>
          {recent.map((p) => (
            <div className="ptrow" key={p.id} style={{ marginBottom: 8 }} onClick={() => onViewPatient(p)}>
              <div>
                <div className="fc gap6 mb6">
                  <span className="code-pill">{p.code}</span>
                  {canSeeField(user?.canSeePii, 'name') && <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{p.name}</span>}
                </div>
                <div className="pt-meta">{p.facility && <>{p.facility} &middot; </>}{p.enrolledAt?.split('T')[0]}</div>
              </div>
              <span className="badge b-ac">{p.leukemiaType}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
