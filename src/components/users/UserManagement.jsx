import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SITES } from '../../constants/index.js';

export default function UserManagement() {
  const { users, addUser, removeUser, t } = useApp();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', username: '', password: '', role: 'entry', sites: [] });
  const [err, setErr] = useState('');

  const u = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleSite = (s) => setF((p) => ({
    ...p,
    sites: p.sites.includes(s) ? p.sites.filter((x) => x !== s) : [...p.sites, s],
  }));

  const create = () => {
    if (!f.name || !f.username || !f.password) { setErr(t.pt.req); return; }
    if (users.find((u) => u.username === f.username)) { setErr('Username taken'); return; }
    addUser({
      ...f,
      id: 'u_' + Date.now().toString(),
      isDefault: false,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    });
    setAdding(false);
    setF({ name: '', username: '', password: '', role: 'entry', sites: [] });
    setErr('');
  };

  const roleColors = { admin: 'b-ac', entry: 'b-ok', viewer: 'b-viewer', liege: 'b-liege' };

  return (
    <div className="fade">
      <div className="fb mb16">
        <div>
          <div className="ph">{t.users.title}</div>
          <div className="ps">{users.length} {t.dash.users.toLowerCase()}</div>
        </div>
        <button className="btn btn-ac" onClick={() => setAdding(true)}>+ {t.users.add}</button>
      </div>

      <div className="al al-warn">{t.users.passNote}</div>

      {adding && (
        <div className="card">
          {err && <div className="al al-err">{err}</div>}
          <div className="g2">
            <div className="f"><label className="lbl">{t.users.name} *</label><input className="inp" value={f.name} onChange={(e) => u('name', e.target.value)} /></div>
            <div className="f"><label className="lbl">{t.users.user} *</label><input className="inp" value={f.username} onChange={(e) => u('username', e.target.value)} /></div>
            <div className="f"><label className="lbl">{t.users.pass} *</label><input type="password" className="inp" value={f.password} onChange={(e) => u('password', e.target.value)} /></div>
            <div className="f">
              <label className="lbl">{t.users.role}</label>
              <select className="sel" value={f.role} onChange={(e) => u('role', e.target.value)}>
                {['admin', 'entry', 'viewer', 'liege'].map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
              </select>
            </div>
          </div>
          {f.role === 'entry' && (
            <div className="f">
              <label className="lbl">{t.users.sites}</label>
              <div className="fc gap8 mt6" style={{ flexWrap: 'wrap' }}>
                {SITES.map((s) => (
                  <button key={s} className={`chip ${f.sites.includes(s) ? 'on' : ''}`} onClick={() => toggleSite(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div className="fc gap8 mt12" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-bd" onClick={() => { setAdding(false); setErr(''); }}>{t.pt.cancel}</button>
            <button className="btn btn-ac" onClick={create}>{t.users.create}</button>
          </div>
        </div>
      )}

      {users.length <= 1 && !adding && (
        <div style={{ textAlign: 'center', color: 'var(--tx2)', padding: '30px 0', fontSize: '.85rem' }}>
          {t.users.none}
        </div>
      )}

      {users.map((usr) => (
        <div className="usr-row" key={usr.id}>
          <div>
            <div className="fc gap8 mb6">
              <span className="pt-name">{usr.name}</span>
              <span className={`badge ${roleColors[usr.role] || 'b-muted'}`}>{t.roles[usr.role]}</span>
            </div>
            <div className="pt-meta">
              @{usr.username}
              {usr.role === 'entry' && usr.sites?.length ? ` \u00b7 ${usr.sites.join(', ')}` : ''}
            </div>
          </div>
          {!usr.isDefault && (
            <button className="btn btn-err btn-xs" onClick={() => removeUser(usr.id)}>
              {t.users.remove}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
