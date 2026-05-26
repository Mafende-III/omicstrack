// Attention-driven dashboard with research-grade visuals.
// Layout follows the HTML proposal:
//   1. Greeting (personal + study tagline + ISO week)
//   2. Shortcut bar (capability-gated)
//   3. Attention card (urgent items)
//   4. KPI tiles with sparklines / progress bars
//   5. Sample journey with bottleneck callout (+ mean wait days)
//   6. Enrollment trend line chart + donut by type
//   7. Facility bars + sample yield card
//   8. Activity feed

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { api } from '../../storage/engine.js';
import { STEP_KEYS } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';

const TYPE_PALETTE = ['#008573', '#4B6BFB', '#7C3AED', '#d97706', '#dc2626', '#6b7280'];

export default function Dashboard({ onViewPatient, onNavigate }) {
  const { patients, t, user } = useApp();
  const [stats, setStats] = useState(null);
  const [attention, setAttention] = useState({ items: [], loading: true });
  const [activity, setActivity] = useState({ items: [], loading: true });
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, a, act, tr] = await Promise.all([
          api.get('/patients/dashboard/stats'),
          api.get('/dashboard/attention'),
          api.get('/dashboard/activity'),
          api.get('/dashboard/enrollment-trend?weeks=12'),
        ]);
        if (cancelled) return;
        setStats(s);
        setAttention({ items: a.items || [], loading: false });
        setActivity({ items: act.items || [], loading: false });
        setTrend(tr);
      } catch {
        if (!cancelled) {
          setAttention({ items: [], loading: false });
          setActivity({ items: [], loading: false });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [patients.length]);

  const greeting = getGreeting();
  const isoWeek = getIsoWeek(new Date());
  const isLiegeView = hasCapability(user, CAPABILITIES.RECEIVE_SHIPMENT)
    && !hasCapability(user, CAPABILITIES.CREATE_SHIPMENT);

  const wf = stats?.steps || { consent: 0, questionnaire: 0, collection: 0, pbmc: 0, transfer: 0 };
  const totalPatients = stats?.total ?? patients.length;
  const thisWeek = stats?.thisWeek ?? 0;
  const fullyComplete = totalPatients > 0
    ? STEP_KEYS.every((k) => wf[k] === totalPatients) ? totalPatients : Math.min(...STEP_KEYS.map((k) => wf[k]))
    : 0;
  const completionPct = totalPatients > 0 ? Math.round((fullyComplete / totalPatients) * 100) : 0;
  const bottleneck = stats?.bottleneck;
  const yieldM = stats?.yield;

  const byType = patients.reduce((a, p) => { a[p.leukemiaType] = (a[p.leukemiaType] || 0) + 1; return a; }, {});
  const byFac = patients.reduce((a, p) => { if (p.facility) { a[p.facility] = (a[p.facility] || 0) + 1; } return a; }, {});

  const trendSeries = trend?.series || [];
  const cumulativeSpark = trendSeries.length > 0 ? cumulative(trendSeries.map((d) => d.count)) : [];
  const recentBars = trendSeries.slice(-6).map((d) => d.count);

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
      {/* ─── 1. Greeting ──────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div className="ph" style={{ marginBottom: 4 }}>
          {greeting}, {firstName(user?.name)}
        </div>
        <div className="ps">
          Leukemia Omics Research &middot; National Reference Laboratory, Rwanda
          {isoWeek && <> &middot; Week {isoWeek} of {new Date().getFullYear()}</>}
        </div>
      </div>

      {/* ─── 2. Shortcut bar ──────────────────────── */}
      <ShortcutBar user={user} stats={stats} onNavigate={onNavigate} isLiegeView={isLiegeView} />

      {/* ─── 3. Attention card ────────────────────── */}
      <AttentionCard
        items={attention.items}
        loading={attention.loading}
        isLiege={isLiegeView}
        onItemClick={handleAttentionClick}
      />

      {/* ─── 4. KPI tiles ─────────────────────────── */}
      {isLiegeView ? (
        <KpiRowLiege stats={stats} totalPatients={totalPatients} />
      ) : (
        <KpiRowClinical
          totalPatients={totalPatients}
          thisWeek={thisWeek}
          fullyComplete={fullyComplete}
          completionPct={completionPct}
          yieldM={yieldM}
          cumulativeSpark={cumulativeSpark}
          recentBars={recentBars}
        />
      )}

      {/* ─── 5. Sample journey ────────────────────── */}
      {!isLiegeView && totalPatients > 0 && (
        <SampleJourney steps={wf} total={totalPatients} bottleneck={bottleneck} />
      )}

      {/* ─── 6. Enrollment trend + Donut by type ──── */}
      {!isLiegeView && totalPatients > 0 && (
        <div className="g2">
          <EnrollmentTrend series={trendSeries} />
          <DonutByType byType={byType} total={totalPatients} />
        </div>
      )}

      {/* ─── 7. Facility bars + Sample yield ──────── */}
      {!isLiegeView && totalPatients > 0 && (
        <div className="g2">
          {canSeeField(user, 'facility') && Object.keys(byFac).length > 0 && (
            <FacilityBars byFac={byFac} total={totalPatients} />
          )}
          {yieldM && <SampleYieldCard yieldM={yieldM} />}
        </div>
      )}

      {/* ─── 8. Activity feed ─────────────────────── */}
      <ActivityFeed items={activity.items} loading={activity.loading} />
    </div>
  );
}

// ─── Shortcut bar ─────────────────────────────────────────────────────

function ShortcutBar({ user, stats, onNavigate, isLiegeView }) {
  const shippableReady = stats?.pipelineCounts?.ready || 0;
  const inboundShipments = (stats?.pipelineCounts?.inTransit || 0);

  const canAddPatient = hasCapability(user, CAPABILITIES.ADD_PATIENT);
  const canCreateShipment = hasCapability(user, CAPABILITIES.CREATE_SHIPMENT);
  const canReceive = hasCapability(user, CAPABILITIES.RECEIVE_SHIPMENT);
  const canEditForms = hasCapability(user, CAPABILITIES.EDIT_FORMS);
  const canManageUsers = hasCapability(user, CAPABILITIES.MANAGE_USERS);

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
      {canAddPatient && (
        <ShortcutBtn primary onClick={() => onNavigate?.('patients')} icon="+" label="Add Patient" />
      )}
      {canCreateShipment && !isLiegeView && (
        <ShortcutBtn
          onClick={() => onNavigate?.('shipments')}
          icon="✈"
          label="Create Shipment"
          badge={shippableReady > 0 ? `${shippableReady} ready` : null}
        />
      )}
      {canReceive && isLiegeView && (
        <ShortcutBtn
          onClick={() => onNavigate?.('shipments')}
          icon="✈"
          label="Receive Shipments"
          badge={inboundShipments > 0 ? `${inboundShipments} inbound` : null}
        />
      )}
      <ShortcutBtn onClick={() => onNavigate?.('patients')} icon="☰" label="All Patients" />
      {canEditForms && (
        <ShortcutBtn onClick={() => onNavigate?.('forms')} icon="✎" label="Forms Editor" />
      )}
      {canManageUsers && (
        <ShortcutBtn onClick={() => onNavigate?.('users')} icon="★" label="Users" />
      )}
    </div>
  );
}

function ShortcutBtn({ primary, icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: primary ? 'var(--ac)' : '#ffffff',
        color: primary ? '#fff' : 'var(--tx)',
        border: `1px solid ${primary ? 'var(--ac)' : 'var(--bd)'}`,
        borderRadius: 10,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '.82rem',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span style={{
          fontSize: '.7rem',
          padding: '2px 8px',
          borderRadius: 999,
          background: primary ? 'rgba(255,255,255,0.25)' : 'var(--ac-bg, #e8f5f2)',
          color: primary ? '#fff' : 'var(--ac)',
          fontWeight: 700,
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Attention card ───────────────────────────────────────────────────

function AttentionCard({ items, loading, isLiege, onItemClick }) {
  if (loading) {
    return (
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--tx3)', fontSize: '.85rem' }}>Checking for items that need attention…</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="card"
        style={{
          marginBottom: 18,
          background: '#f0faf6',
          borderLeft: '4px solid var(--ok)',
        }}
      >
        <div className="fc gap8" style={{ alignItems: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--ok)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 700,
          }}>✓</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--tx)' }}>All clear</div>
            <div style={{ fontSize: '.82rem', color: 'var(--tx2)' }}>
              {isLiege
                ? 'No shipments awaiting your attention right now.'
                : 'No pending workflow items, stalled patients, or shipments to follow up.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const warn = items.filter((i) => i.severity === 'warn').length;
  const headerColor = warn > 0 ? 'var(--err)' : '#d97706';

  return (
    <div className="card" style={{ marginBottom: 18, borderLeft: `4px solid ${headerColor}` }}>
      <div className="fc gap12 mb12" style={{ alignItems: 'center' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: headerColor, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '.9rem',
        }}>{items.length}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.02rem' }}>
          {items.length === 1 ? 'item needs' : 'items need'} your attention
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => onItemClick(item)}
            style={{
              display: 'grid',
              gridTemplateColumns: '8px 1fr auto',
              gap: 14,
              alignItems: 'center',
              padding: '12px 14px',
              background: 'var(--s2)',
              border: '1px solid var(--bd)',
              borderRadius: 10,
              cursor: item.patientId || item.shipmentId ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: item.severity === 'warn' ? 'var(--err)' : '#d97706',
            }} />
            <div>
              <div style={{ fontSize: '.9rem', color: 'var(--tx)', fontWeight: 600 }}>{item.label}</div>
              {item.detail && (
                <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginTop: 2 }}>{item.detail}</div>
              )}
            </div>
            {(item.patientId || item.shipmentId) && (
              <div style={{ fontSize: '.78rem', color: 'var(--ac)', fontWeight: 600 }}>Open →</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI rows ─────────────────────────────────────────────────────────

function KpiRowClinical({ totalPatients, thisWeek, fullyComplete, completionPct, yieldM, cumulativeSpark, recentBars }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
      <KpiTile
        label="Enrolled patients"
        value={totalPatients}
        delta={thisWeek > 0 ? `↑ ${thisWeek} this week` : 'No new enrollments this week'}
        deltaPositive={thisWeek > 0}
        color="var(--tx)"
        accent="var(--ac)"
      >
        <Sparkline points={cumulativeSpark} stroke="var(--ac)" />
      </KpiTile>
      <KpiTile
        label="This week"
        value={thisWeek > 0 ? `+${thisWeek}` : thisWeek}
        delta="vs last 6 weeks"
        color="var(--ac)"
        accent="var(--info, #4B6BFB)"
      >
        <BarSpark bars={recentBars} color="var(--info, #4B6BFB)" />
      </KpiTile>
      <KpiTile
        label="Fully complete"
        value={`${fullyComplete} / ${totalPatients}`}
        delta={`${completionPct}% through transfer`}
        color="var(--ok)"
        accent="var(--ok)"
      >
        <ProgressBar pct={completionPct} color="var(--ok)" />
      </KpiTile>
      <KpiTile
        label="Sample yield"
        value={yieldM?.totalVials ?? 0}
        delta={yieldM?.avgViability ? `vials · avg ${yieldM.avgViability}% viability` : 'vials in storage'}
        color="var(--tx)"
        accent="var(--liege-c, #7C3AED)"
      >
        <YieldMini yieldM={yieldM} />
      </KpiTile>
    </div>
  );
}

function KpiRowLiege({ stats, totalPatients }) {
  const inTransit = stats?.pipelineCounts?.inTransit ?? 0;
  const received = stats?.pipelineCounts?.received ?? 0;
  const yieldM = stats?.yield;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
      <KpiTile label="Awaiting receipt" value={inTransit} color="var(--liege-c, #7C3AED)" accent="var(--liege-c, #7C3AED)" />
      <KpiTile label="Fully received" value={received} color="var(--ok)" accent="var(--ok)" />
      <KpiTile
        label="QC pass rate"
        value={yieldM?.qcPassRate != null ? `${yieldM.qcPassRate}%` : '—'}
        delta={yieldM?.receivedSamples ? `${yieldM.receivedSamples} samples received` : null}
        color="var(--ac)"
        accent="var(--ac)"
      />
    </div>
  );
}

function KpiTile({ label, value, delta, color, accent, children }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--bd)',
      borderRadius: 12,
      padding: '16px 18px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ fontSize: '.7rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color, lineHeight: 1 }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: '.74rem', color: 'var(--tx2)', fontWeight: 500, marginTop: 6 }}>{delta}</div>
      )}
      {children}
    </div>
  );
}

// ─── Charts (inline SVG) ──────────────────────────────────────────────

function Sparkline({ points, stroke = 'var(--ac)' }) {
  if (!points || points.length === 0) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const w = 120;
  const h = 30;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const path = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 30, marginTop: 8 }}>
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function BarSpark({ bars, color = 'var(--info, #4B6BFB)' }) {
  if (!bars || bars.length === 0) return null;
  const max = Math.max(...bars, 1);
  const w = 120;
  const h = 30;
  const bw = w / bars.length - 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 30, marginTop: 8 }}>
      {bars.map((v, i) => {
        const bh = (v / max) * h;
        return (
          <rect
            key={i}
            x={i * (bw + 2)}
            y={h - bh}
            width={bw}
            height={bh || 1}
            fill={color}
            opacity={0.3 + (i / bars.length) * 0.7}
            rx="1"
          />
        );
      })}
    </svg>
  );
}

function ProgressBar({ pct, color = 'var(--ok)' }) {
  return (
    <div style={{ marginTop: 10, height: 6, background: 'var(--s2)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
  );
}

function YieldMini({ yieldM }) {
  if (!yieldM) return null;
  return (
    <div style={{ marginTop: 8, fontSize: '.7rem', color: 'var(--tx3)' }}>
      {yieldM.shippedToLiege > 0 && `${yieldM.shippedToLiege} shipped · `}
      {yieldM.qcPassRate != null ? `${yieldM.qcPassRate}% QC pass` : 'QC pending'}
    </div>
  );
}

// ─── Sample journey ───────────────────────────────────────────────────

const STEP_LABELS = {
  consent: 'Consent',
  questionnaire: 'Quest.',
  collection: 'Collection',
  pbmc: 'PBMC',
  transfer: 'Transfer',
};

function SampleJourney({ steps, total, bottleneck }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="ct">Sample journey</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STEP_KEYS.length}, 1fr)`,
        gap: 8,
        marginTop: 12,
        marginBottom: bottleneck ? 16 : 0,
        position: 'relative',
      }}>
        {STEP_KEYS.map((k, i) => {
          const count = steps[k];
          const isComplete = count === total;
          const isBottleneck = bottleneck?.step === k;
          const isNotLast = i < STEP_KEYS.length - 1;
          return (
            <div key={k} style={{ position: 'relative', textAlign: 'center' }}>
              {isNotLast && (
                <div style={{
                  position: 'absolute',
                  top: 17,
                  left: 'calc(50% + 18px)',
                  right: 'calc(-50% + 18px)',
                  height: 2,
                  background: count > 0 && steps[STEP_KEYS[i + 1]] > 0 ? 'var(--ok)' : 'var(--bd)',
                  zIndex: 0,
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isComplete ? 'var(--ok)' : (isBottleneck ? 'var(--err)' : 'var(--s2)'),
                color: isComplete || isBottleneck ? '#fff' : 'var(--tx2)',
                margin: '0 auto 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '.95rem',
                border: `2px solid ${isComplete ? 'var(--ok)' : (isBottleneck ? 'var(--err)' : 'var(--bd)')}`,
                position: 'relative', zIndex: 1,
              }}>
                {isComplete ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>
                {STEP_LABELS[k]}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: isBottleneck ? 'var(--err)' : 'var(--tx)' }}>
                {count}/{total}
              </div>
            </div>
          );
        })}
      </div>
      {bottleneck && (
        <div style={{
          marginTop: 12,
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          fontSize: '.84rem',
          color: 'var(--tx)',
          lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--err)' }}>Bottleneck:</strong>{' '}
          {bottleneck.pending} patient{bottleneck.pending === 1 ? '' : 's'} waiting at{' '}
          <strong>{STEP_LABELS[bottleneck.step]}</strong>
          {bottleneck.meanWaitDays != null && (
            <>
              {'. Mean wait time '}<strong>{bottleneck.meanWaitDays} day{bottleneck.meanWaitDays === 1 ? '' : 's'}</strong>
              {' — consider follow-up with sites.'}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Enrollment trend (line chart) ────────────────────────────────────

function EnrollmentTrend({ series }) {
  const hasData = series.length > 0 && series.some((d) => d.count > 0);
  return (
    <div className="card">
      <div className="ct">Enrollment trend (last {series.length} weeks)</div>
      {!hasData ? (
        <div style={{ color: 'var(--tx3)', fontSize: '.85rem', padding: '16px 0' }}>
          No enrollments in the displayed window.
        </div>
      ) : (
        <LineChart data={series} />
      )}
    </div>
  );
}

function LineChart({ data }) {
  const w = 600;
  const h = 180;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...data.map((d) => d.count), 1);
  const yTickStep = Math.ceil(max / 4);
  const yMax = yTickStep * 4 || 4;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + innerH - (d.count / yMax) * innerH,
    count: d.count,
    label: d.weekStart,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)},${padT + innerH} L ${points[0].x.toFixed(1)},${padT + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="enroll-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#008573" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#008573" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y grid + labels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = padT + (innerH / 4) * i;
        const v = yMax - i * yTickStep;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="var(--bd)" strokeDasharray={i === 4 ? 'none' : '2,4'} />
            <text x={padL - 6} y={y + 3} fontSize="10" fill="var(--tx3)" textAnchor="end" fontFamily="Inter, sans-serif">{v}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#enroll-area)" stroke="none" />
      <path d={path} fill="none" stroke="#008573" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4 : 3}
          fill="#008573"
          stroke={i === points.length - 1 ? '#fff' : 'none'}
          strokeWidth="2"
        />
      ))}
      {/* X labels: show every Nth */}
      {points.map((p, i) => {
        if (points.length <= 6 || i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) {
          return (
            <text key={i} x={p.x} y={h - 6} fontSize="9" fill="var(--tx3)" textAnchor="middle" fontFamily="Inter, sans-serif">
              {p.label.slice(5)}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
}

// ─── Donut by type ────────────────────────────────────────────────────

function DonutByType({ byType, total }) {
  const entries = Object.entries(byType);
  if (entries.length === 0 || total === 0) {
    return (
      <div className="card">
        <div className="ct">By leukemia type</div>
        <div style={{ color: 'var(--tx3)', fontSize: '.85rem' }}>—</div>
      </div>
    );
  }
  let cursor = 0;
  const stops = entries.map(([, count], idx) => {
    const color = TYPE_PALETTE[idx % TYPE_PALETTE.length];
    const start = cursor;
    cursor += (count / total) * 360;
    return `${color} ${start}deg ${cursor}deg`;
  }).join(', ');

  return (
    <div className="card">
      <div className="ct">By leukemia type</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `conic-gradient(${stops})`,
          position: 'relative',
          flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', inset: 24, borderRadius: '50%',
            background: '#ffffff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--tx)', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: '.62rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>Patients</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {entries.map(([k, v], idx) => (
            <div key={k} className="fb" style={{ padding: '4px 0', fontSize: '.82rem' }}>
              <div className="fc gap6" style={{ alignItems: 'center' }}>
                <span style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                  background: TYPE_PALETTE[idx % TYPE_PALETTE.length],
                }} />
                <span style={{ fontWeight: 600 }}>{k}</span>
              </div>
              <span style={{ color: 'var(--tx2)' }}>{v} · {Math.round((v / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Facility bars ────────────────────────────────────────────────────

function FacilityBars({ byFac, total }) {
  return (
    <div className="card">
      <div className="ct">By facility</div>
      {Object.entries(byFac).map(([k, v], idx) => (
        <div key={k} style={{ marginBottom: 12 }}>
          <div className="fb" style={{ marginBottom: 4, fontSize: '.82rem' }}>
            <span style={{ fontWeight: 600 }}>{k}</span>
            <span style={{ color: 'var(--tx2)' }}>{v} · {Math.round((v / total) * 100)}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--s2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${(v / total) * 100}%`,
              height: '100%',
              background: TYPE_PALETTE[idx % TYPE_PALETTE.length],
              borderRadius: 4,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sample yield card ────────────────────────────────────────────────

function SampleYieldCard({ yieldM }) {
  const rows = [
    { label: 'Total vials in storage', value: yieldM.totalVials, unit: '' },
    { label: 'Avg viability', value: yieldM.avgViability != null ? yieldM.avgViability : '—', unit: yieldM.avgViability != null ? '%' : '' },
    { label: 'Samples shipped to Liège', value: yieldM.shippedToLiege, unit: '' },
    { label: 'Samples received', value: yieldM.receivedSamples, unit: '' },
    { label: 'QC pass rate', value: yieldM.qcPassRate != null ? yieldM.qcPassRate : '—', unit: yieldM.qcPassRate != null ? '%' : '', positive: yieldM.qcPassRate != null && yieldM.qcPassRate >= 90 },
  ];
  return (
    <div className="card">
      <div className="ct">Sample yield</div>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '8px 0',
          borderBottom: i < rows.length - 1 ? '1px solid var(--bd)' : 'none',
        }}>
          <span style={{ fontSize: '.82rem', color: 'var(--tx2)' }}>{r.label}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.05rem',
            color: r.positive ? 'var(--ok)' : 'var(--tx)',
          }}>
            {r.value}{r.unit && <span style={{ fontSize: '.72rem', color: 'var(--tx3)', marginLeft: 3 }}>{r.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────

function ActivityFeed({ items, loading }) {
  return (
    <div className="card">
      <div className="ct">Recent activity</div>
      {loading ? (
        <div style={{ color: 'var(--tx3)', fontSize: '.85rem', padding: '8px 0' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ color: 'var(--tx3)', fontSize: '.85rem', padding: '8px 0' }}>No recent activity.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => (
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
                background: 'var(--ac-bg, #e8f5f2)', color: 'var(--ac-dark, #006659)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '.78rem', fontFamily: 'var(--font-display)',
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
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name) {
  if (!name) return 'there';
  return name.split(' ')[0];
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function cumulative(arr) {
  let running = 0;
  return arr.map((v) => (running += v));
}
