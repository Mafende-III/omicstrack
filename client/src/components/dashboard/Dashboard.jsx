// Dashboard — task-first redesign.
//
// Goal: answer the user's first question on opening the app, not show every
// chart the system can render. See docs/dashboard-redesign-preview.html for
// the visual rationale.
//
// Layout (clinical roles):
//   1. Page head     — first name + subtitle + single primary CTA
//   2. KPI row       — Patients · Vials in storage · Avg viability
//   3. Attention     — items that need action (server-driven)
//   4. Pipeline      — horizontal stage bars with inline bottleneck
//   5. By type       — single-row leukemia-type breakdown
//   6. Activity      — last 5 audit events (compact)
//
// Liège view collapses to 2 KPIs + attention + activity. The shortcut bar,
// 4-up KPI tiles with sparklines, stepper journey, line chart, donut, and
// facility bars from the previous design have been removed from the main
// screen. They can return on a dedicated /analytics view if needed.

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { api } from '../../storage/engine.js';
import { STEP_KEYS } from '../../constants/index.js';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';

const TYPE_PALETTE = ['#008573', '#4B6BFB', '#7C3AED', '#d97706', '#dc2626', '#6b7280'];

const STEP_LABELS = {
  consent: 'Consent',
  questionnaire: 'Questionnaire',
  collection: 'Collection',
  pbmc: 'PBMC',
  transfer: 'Transfer',
};

export default function Dashboard({ onViewPatient, onNavigate }) {
  const { patients, user } = useApp();
  const [stats, setStats] = useState(null);
  const [attention, setAttention] = useState({ items: [], loading: true });
  const [activity, setActivity] = useState({ items: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, a, act] = await Promise.all([
          api.get('/patients/dashboard/stats'),
          api.get('/dashboard/attention'),
          api.get('/dashboard/activity'),
        ]);
        if (cancelled) return;
        setStats(s);
        setAttention({ items: a.items || [], loading: false });
        setActivity({ items: act.items || [], loading: false });
      } catch {
        if (!cancelled) {
          setAttention({ items: [], loading: false });
          setActivity({ items: [], loading: false });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [patients.length]);

  const isLiegeView = hasCapability(user, CAPABILITIES.RECEIVE_SHIPMENT)
    && !hasCapability(user, CAPABILITIES.CREATE_SHIPMENT);
  const canAddPatient = hasCapability(user, CAPABILITIES.ADD_PATIENT);

  const wf = stats?.steps || { consent: 0, questionnaire: 0, collection: 0, pbmc: 0, transfer: 0 };
  const totalPatients = stats?.total ?? patients.length;
  const yieldM = stats?.yield;
  const bottleneck = stats?.bottleneck;

  const byType = patients.reduce((a, p) => { a[p.leukemiaType] = (a[p.leukemiaType] || 0) + 1; return a; }, {});

  const handleAttentionClick = (item) => {
    if (item.patientId) {
      const patient = patients.find((p) => p.id === item.patientId);
      if (patient) onViewPatient(patient);
    } else if (item.shipmentId && onNavigate) {
      onNavigate('shipments');
    }
  };

  return (
    <div className="fade">
      <PageHead
        user={user}
        isLiege={isLiegeView}
        canAddPatient={canAddPatient}
        onAddPatient={() => onNavigate?.('patients')}
      />

      {isLiegeView ? (
        <KpiRowLiege stats={stats} />
      ) : (
        <KpiRowClinical totalPatients={totalPatients} thisWeek={stats?.thisWeek ?? 0} yieldM={yieldM} />
      )}

      {!isLiegeView && totalPatients > 0 && Object.keys(byType).length > 0 && (
        <TypeStrip byType={byType} total={totalPatients} />
      )}

      <AttentionCard
        items={attention.items}
        loading={attention.loading}
        isLiege={isLiegeView}
        onItemClick={handleAttentionClick}
      />

      {!isLiegeView && totalPatients > 0 && (
        <Pipeline steps={wf} total={totalPatients} bottleneck={bottleneck} />
      )}

      <ActivityFeed items={activity.items} loading={activity.loading} />
    </div>
  );
}

// ─── Page head ────────────────────────────────────────────────────────

function PageHead({ user, isLiege, canAddPatient, onAddPatient }) {
  const subtitle = isLiege
    ? 'University of Liège · Sample reception'
    : 'National Reference Laboratory, Rwanda';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 22,
      flexWrap: 'wrap',
    }}>
      <div>
        <div className="ph" style={{ marginBottom: 4 }}>{firstName(user?.name)}</div>
        <div className="ps" style={{ fontSize: '.78rem' }}>{subtitle}</div>
      </div>
      {canAddPatient && !isLiege && (
        <button
          onClick={onAddPatient}
          style={{
            background: 'var(--ac)',
            color: '#fff',
            border: 0,
            borderRadius: 10,
            padding: '11px 18px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Add patient
        </button>
      )}
    </div>
  );
}

// ─── KPI rows ─────────────────────────────────────────────────────────

function KpiRowClinical({ totalPatients, thisWeek, yieldM }) {
  const avgViability = yieldM?.avgViability;
  const totalVials = yieldM?.totalVials ?? 0;
  const submittedCount = yieldM?.totalVials != null && avgViability != null
    ? null // we don't have an n directly; meta line below covers context
    : null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
      <Kpi
        label="Patients"
        value={totalPatients}
        meta={thisWeek > 0 ? `${thisWeek} enrolled this week` : 'No new enrollments this week'}
      />
      <Kpi
        label="Vials in storage"
        value={totalVials}
        meta={yieldM?.shippedToLiege > 0 ? `${yieldM.shippedToLiege} shipped to Liège` : 'No shipments yet'}
      />
      <Kpi
        label="Avg viability"
        value={avgViability != null ? avgViability : '—'}
        unit={avgViability != null ? '%' : ''}
        meta={avgViability != null ? 'across submitted PBMC' : 'No submitted PBMC yet'}
      />
    </div>
  );
}

function KpiRowLiege({ stats }) {
  const inTransit = stats?.pipelineCounts?.inTransit ?? 0;
  const yieldM = stats?.yield;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 22 }}>
      <Kpi
        label="Awaiting receipt"
        value={inTransit}
        meta={inTransit > 0 ? 'See attention list below' : 'Nothing in transit'}
      />
      <Kpi
        label="QC pass rate"
        value={yieldM?.qcPassRate != null ? yieldM.qcPassRate : '—'}
        unit={yieldM?.qcPassRate != null ? '%' : ''}
        meta={yieldM?.receivedSamples ? `${yieldM.receivedSamples} samples received` : 'No samples received yet'}
      />
    </div>
  );
}

function Kpi({ label, value, unit, meta }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--bd)',
      borderRadius: 12,
      padding: '18px 20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        fontSize: '.72rem',
        color: 'var(--tx3)',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        marginBottom: 10,
        fontWeight: 600,
        fontFamily: 'var(--font-ui, system-ui)',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '2.2rem',
        lineHeight: 1,
        letterSpacing: '-.02em',
        color: 'var(--tx)',
      }}>
        {value}
        {unit && <span style={{ fontSize: '1rem', color: 'var(--tx3)', fontWeight: 600, marginLeft: 4 }}>{unit}</span>}
      </div>
      {meta && (
        <div style={{ fontSize: '.76rem', color: 'var(--tx2)', marginTop: 8 }}>{meta}</div>
      )}
    </div>
  );
}

// ─── Attention card ───────────────────────────────────────────────────

function AttentionCard({ items, loading, isLiege, onItemClick }) {
  if (loading) {
    return (
      <SectionHead title="Needs attention" />
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SectionHead title="Needs attention" right={<span style={{ color: 'var(--tx3)', fontSize: '.78rem' }}>0 items</span>} />
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--bd)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 22,
          fontSize: '.85rem',
          color: 'var(--tx3)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {isLiege ? 'No shipments awaiting your attention.' : 'Nothing needs attention.'}
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHead
        title="Needs attention"
        right={<span style={{ color: 'var(--tx3)', fontSize: '.78rem' }}>{items.length} item{items.length === 1 ? '' : 's'}</span>}
      />
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--bd)',
        borderRadius: 12,
        padding: '8px 18px',
        marginBottom: 22,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {items.map((item, i) => {
          const isClickable = !!(item.patientId || item.shipmentId);
          return (
            <div
              key={i}
              onClick={() => isClickable && onItemClick(item)}
              style={{
                display: 'grid',
                gridTemplateColumns: '10px 1fr auto',
                gap: 14,
                alignItems: 'center',
                padding: '12px 4px',
                borderTop: i === 0 ? '0' : '1px solid var(--bd)',
                cursor: isClickable ? 'pointer' : 'default',
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.severity === 'warn' ? 'var(--err)' : '#d97706',
              }} />
              <div>
                <div style={{ fontSize: '.9rem', color: 'var(--tx)', fontWeight: 500 }}>{item.label}</div>
                {item.detail && (
                  <div style={{ fontSize: '.76rem', color: 'var(--tx3)', marginTop: 3 }}>{item.detail}</div>
                )}
              </div>
              {isClickable && (
                <div style={{ fontSize: '.78rem', color: 'var(--ac)', fontWeight: 600 }}>Open →</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Pipeline ─────────────────────────────────────────────────────────

function Pipeline({ steps, total, bottleneck }) {
  return (
    <>
      <SectionHead title="Pipeline" />
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--bd)',
        borderRadius: 12,
        padding: '18px 20px',
        marginBottom: 22,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {STEP_KEYS.map((k) => {
          const count = steps[k] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const isBottleneck = bottleneck?.step === k;
          return (
            <div key={k} style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 60px',
              gap: 14,
              alignItems: 'center',
              padding: '9px 0',
            }}>
              <div style={{ fontSize: '.85rem', color: 'var(--tx2)', fontWeight: 500 }}>
                {STEP_LABELS[k]}
              </div>
              <div style={{
                height: 22,
                background: 'var(--s2)',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: isBottleneck ? 'var(--err)' : 'var(--ac)',
                  borderRadius: 6,
                  transition: 'width .4s ease',
                }} />
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '.95rem',
                textAlign: 'right',
                color: isBottleneck ? 'var(--err)' : 'var(--tx)',
              }}>
                {count} / {total}
              </div>
            </div>
          );
        })}
        {bottleneck && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: '#fef2f2',
            borderRadius: 8,
            fontSize: '.82rem',
            color: 'var(--tx)',
          }}>
            <strong style={{ color: 'var(--err)' }}>Bottleneck at {STEP_LABELS[bottleneck.step]}</strong>
            {' · '}{bottleneck.pending} waiting
            {bottleneck.meanWaitDays != null && (
              <> · avg {bottleneck.meanWaitDays} day{bottleneck.meanWaitDays === 1 ? '' : 's'}</>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── By leukemia type ─────────────────────────────────────────────────

function TypeStrip({ byType, total }) {
  const entries = Object.entries(byType);
  return (
    <>
      <SectionHead
        title="By leukemia type"
        right={<span style={{ color: 'var(--tx3)', fontSize: '.78rem' }}>{total} patient{total === 1 ? '' : 's'}</span>}
      />
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--bd)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 22,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          display: 'flex',
          height: 14,
          borderRadius: 7,
          overflow: 'hidden',
          background: 'var(--s2)',
        }}>
          {entries.map(([k, v], idx) => (
            <div
              key={k}
              title={`${k}: ${v}`}
              style={{
                width: `${(v / total) * 100}%`,
                height: '100%',
                background: TYPE_PALETTE[idx % TYPE_PALETTE.length],
              }}
            />
          ))}
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 20px',
          marginTop: 14,
          fontSize: '.82rem',
        }}>
          {entries.map(([k, v], idx) => (
            <div key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                background: TYPE_PALETTE[idx % TYPE_PALETTE.length],
              }} />
              <span style={{ color: 'var(--tx)', fontWeight: 600 }}>{k}</span>
              <span style={{ color: 'var(--tx3)' }}>{v} · {Math.round((v / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────

function ActivityFeed({ items, loading }) {
  const visible = items.slice(0, 5);
  return (
    <>
      <SectionHead title="Recent activity" />
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--bd)',
        borderRadius: 12,
        padding: '4px 18px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {loading ? (
          <div style={{ color: 'var(--tx3)', fontSize: '.85rem', padding: '14px 0' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ color: 'var(--tx3)', fontSize: '.85rem', padding: '14px 0' }}>No activity yet.</div>
        ) : (
          visible.map((item, i) => (
            <div key={item.id} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: 12,
              padding: '12px 0',
              borderTop: i > 0 ? '1px solid var(--bd)' : 'none',
              alignItems: 'start',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--ac-bg, #e8f5f2)',
                color: 'var(--ac-dark, #006659)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '.78rem',
                fontFamily: 'var(--font-display)',
              }}>
                {initials(item.userName)}
              </div>
              <div style={{ fontFamily: 'var(--font-ui, system-ui)' }}>
                <div style={{ fontSize: '.86rem', color: 'var(--tx)' }}>
                  <strong style={{ fontWeight: 600 }}>{item.userName}</strong>{' '}
                  <span style={{ color: 'var(--tx2)' }}>{item.verb}</span>
                </div>
                {item.details && (
                  <div style={{ fontSize: '.76rem', color: 'var(--tx3)', marginTop: 2, lineHeight: 1.5 }}>
                    {item.details}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── Section head ─────────────────────────────────────────────────────

function SectionHead({ title, right }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 10,
    }}>
      <h2 style={{
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1rem',
        letterSpacing: '-.005em',
      }}>
        {title}
      </h2>
      {right}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function firstName(name) {
  if (!name) return 'there';
  return name.split(' ')[0];
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
