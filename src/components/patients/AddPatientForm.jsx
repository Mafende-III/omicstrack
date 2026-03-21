import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SITES, LK_TYPES } from '../../constants/index.js';

export default function AddPatientForm({ onSave, onCancel }) {
  const { t, patients, user } = useApp();
  const userSites = user?.role === 'entry' ? (user.sites || []) : SITES;

  const [f, setF] = useState({
    code: '',
    name: '',
    age: '',
    leukemiaType: 'AML',
    treatment: 'On Treatment',
    facility: userSites[0] || 'CHUK',
  });
  const [err, setErr] = useState('');

  const u = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.code || !f.name || !f.age) { setErr(t.pt.req); return; }
    if (patients.find((p) => p.code === f.code)) { setErr('Code already exists'); return; }
    onSave({
      ...f,
      age: parseInt(f.age, 10) || 0,
      id: 'p_' + Date.now().toString(),
      enrolledAt: new Date().toISOString(),
      enrolledBy: user?.id,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.id,
    });
  };

  return (
    <div className="card fade">
      <div className="ct">{t.pt.add}</div>
      {err && <div className="al al-err">{err}</div>}
      <div className="g2">
        <div className="f">
          <label className="lbl">{t.pt.code} *</label>
          <input className="inp" placeholder="e.g. 005" value={f.code} onChange={(e) => u('code', e.target.value)} />
        </div>
        <div className="f">
          <label className="lbl">{t.pt.name} *</label>
          <input className="inp" value={f.name} onChange={(e) => u('name', e.target.value)} />
        </div>
        <div className="f">
          <label className="lbl">{t.pt.age} *</label>
          <input type="number" className="inp" value={f.age} onChange={(e) => u('age', e.target.value)} />
        </div>
        <div className="f">
          <label className="lbl">{t.pt.type}</label>
          <select className="sel" value={f.leukemiaType} onChange={(e) => u('leukemiaType', e.target.value)}>
            {LK_TYPES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="f">
          <label className="lbl">{t.pt.tx}</label>
          <select className="sel" value={f.treatment} onChange={(e) => u('treatment', e.target.value)}>
            <option value="On Treatment">{t.pt.onTx}</option>
            <option value="Not on Treatment">{t.pt.offTx}</option>
          </select>
        </div>
        <div className="f">
          <label className="lbl">{t.pt.fac}</label>
          <select className="sel" value={f.facility} onChange={(e) => u('facility', e.target.value)}>
            {userSites.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="fc gap8 mt12" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-bd" onClick={onCancel}>{t.pt.cancel}</button>
        <button className="btn btn-ac" onClick={save}>{t.pt.save}</button>
      </div>
    </div>
  );
}
