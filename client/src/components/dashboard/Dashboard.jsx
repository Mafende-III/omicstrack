import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { api } from '../../storage/engine.js';
import { STEP_KEYS } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';
import ShipmentPipeline from './ShipmentPipeline.jsx';
import DashboardResearch from './DashboardResearch.jsx';
import DashboardSaaS from './DashboardSaaS.jsx';

const STYLE_KEY = 'omics_dashboard_style';

export default function Dashboard({ onViewPatient }) {
  const { patients, users, t, user } = useApp();
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [style, setStyle] = useState(() => {
    try { return localStorage.getItem(STYLE_KEY) || 'research'; } catch { return 'research'; }
  });

  const setStylePersist = (s) => {
    setStyle(s);
    try { localStorage.setItem(STYLE_KEY, s); } catch { /* ignore */ }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/patients/dashboard/stats');
        if (!cancelled) setStats(data);
      } catch {
        // fall back to client-side basic stats
      }
      // Liege team also wants live shipment data
      if (hasCapability(user, CAPABILITIES.RECEIVE_SHIPMENT)) {
        try {
          const sh = await api.get('/shipments');
          if (!cancelled) setShipments(sh || []);
        } catch {
          // ignore
        }
      }
    })();
    return () => { cancelled = true; };
  }, [patients, user]);

  // Derived numbers — always from real data, never from seed defaults.
  const onTx = patients.filter((p) => p.treatment === 'On Treatment').length;
  const sites = [...new Set(patients.map((p) => p.facility).filter(Boolean))].length;
  const byType = patients.reduce((a, p) => { a[p.leukemiaType] = (a[p.leukemiaType] || 0) + 1; return a; }, {});
  const byFac = patients.reduce((a, p) => { if (p.facility) { a[p.facility] = (a[p.facility] || 0) + 1; } return a; }, {});
  const recent = [...patients].sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)).slice(0, 5);

  const wf = stats?.steps || { consent: 0, questionnaire: 0, collection: 0, pbmc: 0, transfer: 0 };
  const fullyComplete = stats
    ? (STEP_KEYS.every((k) => wf[k] === stats.total)
        ? stats.total
        : Math.min(...STEP_KEYS.map((k) => wf[k])))
    : 0;

  const avgAge = patients.length > 0 && canSeeField(user?.canSeePii, 'age')
    ? Math.round(patients.reduce((s, p) => s + (parseInt(p.age, 10) || 0), 0) / patients.length)
    : null;

  // Per-role hero stats. Liege-style view is for users whose PRIMARY mode is
  // receiving shipments (they can receive but not create). Admins who happen
  // to have receive_shipment still see the clinical dashboard.
  const isLiegeView = hasCapability(user, CAPABILITIES.RECEIVE_SHIPMENT)
    && !hasCapability(user, CAPABILITIES.CREATE_SHIPMENT);
  const canManageUsers = hasCapability(user, CAPABILITIES.MANAGE_USERS);

  const heroStats = isLiegeView
    ? buildLiegeHero(shipments, patients)
    : buildClinicalHero({ patients, onTx, sites, users, canManageUsers, t });

  // Pipeline status block — shows where each patient is in the workflow
  const pipeline = stats?.pipelineCounts;

  const variantProps = {
    t, user, patients, recent, byType, byFac, wf, fullyComplete,
    pipeline, avgAge, onTx, sites, users, canManageUsers, heroStats, onViewPatient,
  };

  return (
    <div className="fade">
      <div className="fb mb8" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="ph">{t.dash.title}</div>
          <div className="ps">Leukemia Omics Research &middot; National Reference Laboratory, Rwanda</div>
        </div>
        <StyleToggle style={style} onChange={setStylePersist} />
      </div>

      {/* Liège team: shipment pipeline always shows first, regardless of style */}
      {isLiegeView && (
        <ShipmentPipeline onViewPatient={onViewPatient} />
      )}

      {!isLiegeView && style === 'research' && <DashboardResearch {...variantProps} />}
      {!isLiegeView && style === 'saas' && <DashboardSaaS {...variantProps} />}

      {/* Liège users get a minimal summary in either style */}
      {isLiegeView && recent.length > 0 && (
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
    </div>
  );
}

function StyleToggle({ style, onChange }) {
  const btnBase = {
    padding: '4px 10px', fontSize: '.72rem', fontWeight: 600,
    border: '1px solid var(--bd)', borderRadius: 6, cursor: 'pointer',
    fontFamily: 'var(--font-display)', letterSpacing: '.02em',
  };
  return (
    <div className="fc" style={{ gap: 0, border: '1px solid var(--bd)', borderRadius: 8, padding: 2, background: 'var(--s1)' }}>
      <button
        onClick={() => onChange('research')}
        style={{
          ...btnBase, border: 'none',
          background: style === 'research' ? '#ffffff' : 'transparent',
          color: style === 'research' ? 'var(--ac)' : 'var(--tx2)',
          boxShadow: style === 'research' ? 'var(--shadow-sm)' : 'none',
        }}
      >Research</button>
      <button
        onClick={() => onChange('saas')}
        style={{
          ...btnBase, border: 'none',
          background: style === 'saas' ? '#ffffff' : 'transparent',
          color: style === 'saas' ? 'var(--ac)' : 'var(--tx2)',
          boxShadow: style === 'saas' ? 'var(--shadow-sm)' : 'none',
        }}
      >SaaS</button>
    </div>
  );
}

function buildClinicalHero({ patients, onTx, sites, users, canManageUsers, t }) {
  const tiles = [
    { n: patients.length, l: t.dash.total, c: 'var(--tx)' },
    { n: onTx, l: t.dash.onTx, c: 'var(--ok)' },
    { n: sites, l: t.dash.sites, c: 'var(--ac)' },
  ];
  if (canManageUsers) {
    tiles.push({ n: users.length, l: t.dash.users, c: 'var(--viewer-c)' });
  }
  return tiles;
}

function buildLiegeHero(shipments, patients) {
  const inTransit = shipments.filter((s) => s.status === 'shipped' || s.status === 'in_transit').length;
  const partial = shipments.filter((s) => s.status === 'partial').length;
  const received = shipments.filter((s) => s.status === 'received').length;
  return [
    { n: inTransit, l: 'Awaiting receipt', c: 'var(--liege-c)' },
    { n: partial, l: 'Partial receipt', c: 'var(--tx)' },
    { n: received, l: 'Fully received', c: 'var(--ok)' },
    { n: patients.length, l: 'Patients in study', c: 'var(--ac)' },
  ];
}
