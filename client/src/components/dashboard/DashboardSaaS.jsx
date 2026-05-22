// Variant B: modern SaaS dashboard aesthetic.
// - Compact KPI row with delta-style sub-text
// - Horizontal "funnel" workflow showing flow through 5 stages
// - Donut-style distribution using CSS conic gradients
// - Denser tabular recent activity

import { STEP_KEYS } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';

const DONUT_PALETTE = ['#008573', '#4B6BFB', '#7C3AED', '#f59e0b', '#ef4444', '#6b7280'];

export default function DashboardSaaS({
  t, user, patients, recent, byType, byFac, wf, fullyComplete,
  pipeline, avgAge, onTx, sites, users, canManageUsers, heroStats, onViewPatient,
}) {
  return (
    <>
      {/* KPI Strip — denser, with delta line under each */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--bd)',
        borderRadius: 12,
        padding: '6px 0',
        marginBottom: 18,
        boxShadow: 'var(--shadow-sm)',
        display: 'grid',
        gridTemplateColumns: `repeat(${heroStats.length}, 1fr)`,
      }}>
        {heroStats.map((s, i) => (
          <div key={i} style={{
            padding: '14px 18px',
            borderRight: i < heroStats.length - 1 ? '1px solid var(--bd)' : 'none',
          }}>
            <div style={{ fontSize: '.7rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
              {s.l}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.85rem', color: s.c, lineHeight: 1 }}>
              {s.n}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow funnel — horizontal flow with arrow connectors */}
      {patients.length > 0 && (
        <div className="card">
          <div className="fb mb16">
            <div className="ct" style={{ marginBottom: 0 }}>{t.dash.workflow || 'Workflow Progress'}</div>
            <span style={{ fontSize: '.78rem', color: 'var(--tx3)' }}>
              {fullyComplete} / {patients.length} fully complete
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${STEP_KEYS.length}, 1fr)`,
            gap: 6,
          }}>
            {STEP_KEYS.map((k, i) => {
              const count = wf[k];
              const pct = patients.length > 0 ? Math.round((count / patients.length) * 100) : 0;
              const isLast = i === STEP_KEYS.length - 1;
              return (
                <div key={k} style={{ position: 'relative' }}>
                  <div style={{
                    background: pct === 100 ? '#e8f5f2' : 'var(--s2)',
                    border: `1px solid ${pct === 100 ? '#008573' : 'var(--bd)'}`,
                    borderRadius: 8,
                    padding: '12px 8px',
                    textAlign: 'center',
                    clipPath: isLast ? 'none' : 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 8px 50%)',
                    paddingRight: isLast ? '8px' : '20px',
                    paddingLeft: i === 0 ? '8px' : '20px',
                  }}>
                    <div style={{ fontSize: '.65rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                      {t.steps[k]}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: pct === 100 ? 'var(--ok)' : 'var(--tx)' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: '.7rem', color: 'var(--tx2)' }}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          {pipeline && (
            <div className="fc gap6 mt16" style={{ flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--tx2)' }}>
              <span><strong style={{ color: 'var(--tx)' }}>{pipeline.preCollection}</strong> pre-collection</span>
              <span style={{ color: 'var(--tx3)' }}>·</span>
              <span><strong style={{ color: 'var(--tx)' }}>{pipeline.processing}</strong> processing</span>
              <span style={{ color: 'var(--tx3)' }}>·</span>
              <span><strong style={{ color: 'var(--tx)' }}>{pipeline.ready}</strong> ready</span>
              <span style={{ color: 'var(--tx3)' }}>·</span>
              <span><strong style={{ color: 'var(--liege-c)' }}>{pipeline.inTransit}</strong> in transit</span>
              <span style={{ color: 'var(--tx3)' }}>·</span>
              <span><strong style={{ color: 'var(--ok)' }}>{pipeline.received}</strong> received</span>
            </div>
          )}
        </div>
      )}

      {/* Distribution — donut chart for leukemia type, horizontal stacked bar for facility */}
      {patients.length > 0 && (
        <div className="g2">
          <div className="card">
            <div className="ct">{t.dash.byType}</div>
            <DonutChart data={byType} total={patients.length} />
          </div>
          {canSeeField(user?.canSeePii, 'facility') && (
            <div className="card">
              <div className="ct">{t.dash.byFac}</div>
              <StackedBar data={byFac} total={patients.length} />
            </div>
          )}
        </div>
      )}

      {/* KPI cards — demographics + collection numbers in compact format */}
      {patients.length > 0 && avgAge !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <KpiCard label={t.dash.avgAge || 'Average Age'} value={`${avgAge}`} unit="yrs" color="var(--tx)" />
          <KpiCard label={t.pt.onTx} value={`${onTx}`} unit={`/ ${patients.length}`} color="var(--ok)" />
          <KpiCard label={t.dash.collected || 'Collected'} value={`${wf.collection}`} unit="samples" color="var(--ac)" />
          <KpiCard label={t.dash.transferred || 'Transferred'} value={`${wf.transfer}`} unit="samples" color="var(--liege-c)" />
        </div>
      )}

      {/* Recent activity — dense rows */}
      {recent.length > 0 && (
        <div className="card">
          <div className="ct">{t.dash.recent}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recent.map((p, i) => (
              <div
                key={p.id}
                onClick={() => onViewPatient(p)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr auto auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 4px',
                  borderTop: i > 0 ? '1px solid var(--bd)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="code-pill">{p.code}</span>
                <div>
                  {canSeeField(user?.canSeePii, 'name') && <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{p.name}</div>}
                  <div style={{ fontSize: '.72rem', color: 'var(--tx3)' }}>{p.enrolledAt?.split('T')[0]}</div>
                </div>
                {p.facility && <span className="badge b-muted" style={{ fontSize: '.7rem' }}>{p.facility}</span>}
                <span className="badge b-ac" style={{ fontSize: '.7rem' }}>{p.leukemiaType}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value, unit, color }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid var(--bd)', borderRadius: 10,
      padding: '14px 16px', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: '.7rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
        {label}
      </div>
      <div className="fc gap6">
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: '.78rem', color: 'var(--tx3)' }}>{unit}</span>
      </div>
    </div>
  );
}

function DonutChart({ data, total }) {
  const entries = Object.entries(data);
  if (entries.length === 0 || total === 0) {
    return <div style={{ color: 'var(--tx2)', fontSize: '.85rem' }}>—</div>;
  }
  // Build conic gradient stops
  let cursor = 0;
  const stops = entries.map(([, count], idx) => {
    const color = DONUT_PALETTE[idx % DONUT_PALETTE.length];
    const start = cursor;
    cursor += (count / total) * 360;
    return `${color} ${start}deg ${cursor}deg`;
  }).join(', ');

  return (
    <div className="fc gap16" style={{ alignItems: 'center', marginTop: 8 }}>
      <div style={{
        width: 110, height: 110, borderRadius: '50%',
        background: `conic-gradient(${stops})`,
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 22, borderRadius: '50%',
          background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--tx)',
        }}>
          {total}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {entries.map(([k, v], idx) => (
          <div key={k} className="fb" style={{ marginBottom: 6 }}>
            <div className="fc gap6">
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                background: DONUT_PALETTE[idx % DONUT_PALETTE.length],
              }} />
              <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{k}</span>
            </div>
            <span style={{ fontSize: '.82rem', color: 'var(--tx2)' }}>{v} · {Math.round((v / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBar({ data, total }) {
  const entries = Object.entries(data);
  if (entries.length === 0 || total === 0) {
    return <div style={{ color: 'var(--tx2)', fontSize: '.85rem' }}>—</div>;
  }
  return (
    <>
      <div style={{
        display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden',
        border: '1px solid var(--bd)', marginTop: 8, marginBottom: 12,
      }}>
        {entries.map(([k, v], idx) => (
          <div
            key={k}
            title={`${k}: ${v}`}
            style={{
              width: `${(v / total) * 100}%`,
              background: DONUT_PALETTE[idx % DONUT_PALETTE.length],
            }}
          />
        ))}
      </div>
      {entries.map(([k, v], idx) => (
        <div key={k} className="fb" style={{ marginBottom: 6 }}>
          <div className="fc gap6">
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: 2,
              background: DONUT_PALETTE[idx % DONUT_PALETTE.length],
            }} />
            <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{k}</span>
          </div>
          <span style={{ fontSize: '.82rem', color: 'var(--tx2)' }}>{v} · {Math.round((v / total) * 100)}%</span>
        </div>
      ))}
    </>
  );
}
