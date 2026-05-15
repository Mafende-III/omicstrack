import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SITES, LK_TYPES } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';
import AddPatientForm from './AddPatientForm.jsx';

export default function PatientList({ onSelect }) {
  const { patients, user, t, addPatient } = useApp();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [txFilter, setTxFilter] = useState('');

  const role = user?.role;
  const userSites = user?.sites || [];
  const canAdd = role !== 'viewer' && role !== 'liege';

  const visible = patients.filter((p) => {
    if (role === 'entry' && userSites.length && !userSites.includes(p.facility)) return false;
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
    const matchType = !typeFilter || p.leukemiaType === typeFilter;
    const matchSite = !siteFilter || p.facility === siteFilter;
    const matchTx = !txFilter || p.treatment === txFilter;
    return matchSearch && matchType && matchSite && matchTx;
  });

  const hasFilters = typeFilter || siteFilter || txFilter;
  const clearFilters = () => { setTypeFilter(''); setSiteFilter(''); setTxFilter(''); };

  return (
    <div className="fade">
      <div className="fb mb16">
        <div>
          <div className="ph">{t.pt.all}</div>
          <div className="ps">{patients.length} {t.pt.enrolled.toLowerCase()}</div>
        </div>
        {canAdd && (
          <button className="btn btn-ac" onClick={() => setAdding(true)}>
            + {t.pt.add}
          </button>
        )}
      </div>

      {role === 'viewer' && <div className="al al-viewer">{t.roleBanner.viewOnly}</div>}
      {role === 'liege' && <div className="al al-liege">{t.roleBanner.liegeInfo}</div>}
      {role === 'entry' && userSites.length === 0 && <div className="al al-warn">{t.roleBanner.noSites}</div>}
      {role === 'entry' && userSites.length > 0 && (
        <div className="al al-info">{t.roleBanner.siteRestricted} {userSites.join(', ')}</div>
      )}

      {adding && (
        <AddPatientForm
          onSave={async (p) => { await addPatient(p); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="srch-w">
        <span className="srch-i">&#128269;</span>
        <input
          className="srch"
          placeholder={t.pt.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter row */}
      <div className="fc gap8 mb12" style={{ flexWrap: 'wrap' }}>
        <select
          className="sel"
          style={{ width: 'auto', minWidth: 130, padding: '6px 10px', fontSize: '.82rem' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">{t.dash.byType || 'All Types'}</option>
          {LK_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        {canSeeField(user?.canSeePii, 'facility') && (
          <select
            className="sel"
            style={{ width: 'auto', minWidth: 130, padding: '6px 10px', fontSize: '.82rem' }}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="">{t.dash.byFac || 'All Facilities'}</option>
            {SITES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <select
          className="sel"
          style={{ width: 'auto', minWidth: 140, padding: '6px 10px', fontSize: '.82rem' }}
          value={txFilter}
          onChange={(e) => setTxFilter(e.target.value)}
        >
          <option value="">{t.pt.tx || 'Treatment Status'}</option>
          <option value="On Treatment">{t.pt.onTx}</option>
          <option value="Not on Treatment">{t.pt.offTx}</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            &times; Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: '.8rem', color: 'var(--tx3)', marginBottom: 10 }}>
        {visible.length} / {patients.length} {t.pt.enrolled.toLowerCase()}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--tx2)', padding: '40px 0', fontSize: '.88rem' }}>
          {t.pt.none}
        </div>
      )}

      {visible.map((p) => (
        <div className="ptrow" key={p.id} onClick={() => onSelect(p)}>
          <div>
            <div className="fc gap6 mb6">
              <span className="code-pill">{p.code}</span>
              {canSeeField(user?.canSeePii, 'name') && <span className="pt-name">{p.name}</span>}
            </div>
            <div className="pt-meta">
              {p.age != null && <>{p.age} yrs &middot; </>}{p.facility && <>{p.facility} &middot; </>}{p.enrolledAt?.split('T')[0]}
            </div>
          </div>
          <div className="fc gap8">
            <span className="badge b-ac">{p.leukemiaType}</span>
            <span className={`badge ${p.treatment === 'On Treatment' ? 'b-ok' : 'b-muted'}`}>
              {p.treatment === 'On Treatment' ? t.pt.onTx : t.pt.offTx}
            </span>
            <span style={{ color: 'var(--tx3)' }}>&rsaquo;</span>
          </div>
        </div>
      ))}
    </div>
  );
}
