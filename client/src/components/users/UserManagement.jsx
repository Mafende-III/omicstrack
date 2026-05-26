import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SITES } from '../../constants/index.js';
import { CAPABILITY_GROUPS, capabilitiesForRole } from '../../constants/capabilities.js';

export default function UserManagement() {
  const { users, addUser, updateUser, removeUser, t } = useApp();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [f, setF] = useState({ name: '', username: '', email: '', role: 'entry', sites: [], canSeeName: true, canSeeAge: true, canSeeFacility: true });
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const u = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleSite = (s) => setF((p) => ({
    ...p,
    sites: p.sites.includes(s) ? p.sites.filter((x) => x !== s) : [...p.sites, s],
  }));

  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!f.name || !f.username || !f.email) { setErr('Name, username, and email are required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { setErr('Enter a valid email address'); return; }
    if (users.find((u) => u.username === f.username)) { setErr('Username taken'); return; }
    if (users.find((u) => u.email && u.email.toLowerCase() === f.email.toLowerCase())) { setErr('Email already in use'); return; }
    setSaving(true);
    try {
      // Server still accepts legacy canSeePii — set it to true if any field is allowed
      const payload = { ...f, canSeePii: f.canSeeName || f.canSeeAge || f.canSeeFacility };
      const created = await addUser(payload);
      setAdding(false);
      setF({ name: '', username: '', email: '', role: 'entry', sites: [], canSeeName: true, canSeeAge: true, canSeeFacility: true });
      setErr('');
      const status = created?.welcomeEmailStatus;
      if (status === 'sent') {
        setToast(`Welcome email sent to ${f.email}. They have 24 hours to set their password.`);
      } else if (status === 'dev_logged') {
        setToast(`User created. Email logged to server console (no SENDGRID_API_KEY set).`);
      } else if (status === 'failed') {
        setToast(`User created, but the welcome email failed to send. Check audit log.`);
      } else {
        setToast(`User created.`);
      }
      setTimeout(() => setToast(''), 6000);
    } catch (e) {
      setErr(e.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
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

      <div className="al al-info">
        New users receive a welcome email with a one-time setup link to choose their own password. The link is valid for 24 hours.
      </div>

      {toast && <div className="al al-ok mb12">{toast}</div>}

      {adding && (
        <div className="card">
          {err && <div className="al al-err">{err}</div>}
          <div className="g2">
            <div className="f"><label className="lbl">{t.users.name} *</label><input className="inp" value={f.name} onChange={(e) => u('name', e.target.value)} /></div>
            <div className="f"><label className="lbl">{t.users.user} *</label><input className="inp" value={f.username} onChange={(e) => u('username', e.target.value)} placeholder="e.g. jdoe" /></div>
            <div className="f"><label className="lbl">Email *</label><input type="email" className="inp" value={f.email} onChange={(e) => u('email', e.target.value)} placeholder="user@example.com" /></div>
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
          <div className="card-inner mt12">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 6 }}>
              Patient personal data access
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginBottom: 10 }}>
              Grant per-field access. Useful when sharing limited views with a collaborator.
            </div>
            <label className="cbox"><input type="checkbox" checked={f.canSeeName} onChange={(e) => u('canSeeName', e.target.checked)} /><span className="cbox-lbl">Can view patient name</span></label>
            <label className="cbox"><input type="checkbox" checked={f.canSeeAge} onChange={(e) => u('canSeeAge', e.target.checked)} /><span className="cbox-lbl">Can view patient age</span></label>
            <label className="cbox"><input type="checkbox" checked={f.canSeeFacility} onChange={(e) => u('canSeeFacility', e.target.checked)} /><span className="cbox-lbl">Can view patient facility</span></label>
          </div>
          <div className="fc gap8 mt12" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-bd" onClick={() => { setAdding(false); setErr(''); }}>{t.pt.cancel}</button>
            <button className="btn btn-ac" onClick={create} disabled={saving}>{saving ? '...' : t.users.create}</button>
          </div>
        </div>
      )}

      {users.length <= 1 && !adding && (
        <div style={{ textAlign: 'center', color: 'var(--tx2)', padding: '30px 0', fontSize: '.85rem' }}>
          {t.users.none}
        </div>
      )}

      {users.map((usr) => (
        <div key={usr.id}>
          {editingId === usr.id ? (
            <EditUserCard
              user={usr}
              onCancel={() => { setEditingId(null); setErr(''); }}
              onSave={async (changes) => {
                try {
                  await updateUser(usr.id, changes);
                  setEditingId(null);
                  setToast(`${usr.name} updated.`);
                  setTimeout(() => setToast(''), 4000);
                  setErr('');
                } catch (e) {
                  setErr(e.message || 'Failed to update user');
                }
              }}
              roleColors={roleColors}
              t={t}
              err={err}
            />
          ) : (
            <div className="usr-row">
              <div>
                <div className="fc gap8 mb6">
                  <span className="pt-name">{usr.name}</span>
                  <span className={`badge ${roleColors[usr.role] || 'b-muted'}`}>{t.roles[usr.role]}</span>
                </div>
                <div className="pt-meta">
                  @{usr.username}
                  {usr.email && <> &middot; {usr.email}</>}
                  {usr.role === 'entry' && usr.sites?.length ? ` \u00b7 ${usr.sites.join(', ')}` : ''}
                  {(() => {
                    const fields = [];
                    if (usr.canSeeName === false) fields.push('name');
                    if (usr.canSeeAge === false) fields.push('age');
                    if (usr.canSeeFacility === false) fields.push('facility');
                    if (fields.length === 0) return null;
                    const label = fields.length === 3 ? 'No PII access' : `Cannot see: ${fields.join(', ')}`;
                    return <> &middot; <span style={{ color: 'var(--err)' }}>{label}</span></>;
                  })()}
                </div>
              </div>
              <div className="fc gap6">
                <button className="btn btn-bd btn-xs" onClick={() => setEditingId(usr.id)}>Edit</button>
                {!usr.isDefault && (
                  <button className="btn btn-err btn-xs" onClick={async () => {
                    try { await removeUser(usr.id); } catch { /* ignore */ }
                  }}>
                    {t.users.remove}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EditUserCard({ user, onCancel, onSave, roleColors, t, err }) {
  const initialCaps = Array.isArray(user.capabilities) && user.capabilities.length > 0
    ? user.capabilities
    : capabilitiesForRole(user.role);
  const [f, setF] = useState({
    name: user.name,
    email: user.email || '',
    role: user.role,
    sites: user.sites || [],
    // Per-field PII flags; fall back to legacy canSeePii if the user record
    // predates migration 012 (those rows haven't been split yet).
    canSeeName: user.canSeeName !== undefined ? user.canSeeName : (user.canSeePii !== false),
    canSeeAge: user.canSeeAge !== undefined ? user.canSeeAge : (user.canSeePii !== false),
    canSeeFacility: user.canSeeFacility !== undefined ? user.canSeeFacility : (user.canSeePii !== false),
    capabilities: initialCaps,
  });
  const [capsCustomized, setCapsCustomized] = useState(false);
  const [saving, setSaving] = useState(false);

  const u = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleSite = (s) => setF((p) => ({
    ...p,
    sites: p.sites.includes(s) ? p.sites.filter((x) => x !== s) : [...p.sites, s],
  }));

  const toggleCap = (capId) => {
    setCapsCustomized(true);
    setF((p) => ({
      ...p,
      capabilities: p.capabilities.includes(capId)
        ? p.capabilities.filter((x) => x !== capId)
        : [...p.capabilities, capId],
    }));
  };

  // When role changes, if admin hasn't manually tweaked capabilities yet,
  // re-seed from the new role's preset.
  useEffect(() => {
    if (!capsCustomized) {
      setF((p) => ({ ...p, capabilities: capabilitiesForRole(p.role) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.role]);

  const resetToRoleDefaults = () => {
    setF((p) => ({ ...p, capabilities: capabilitiesForRole(p.role) }));
    setCapsCustomized(false);
  };

  const save = async () => {
    if (!f.name) return;
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return;
    setSaving(true);
    await onSave({
      name: f.name,
      email: f.email || null,
      role: f.role,
      sites: f.sites,
      // Combined canSeePii kept as true if any field is allowed (back-compat)
      canSeePii: f.canSeeName || f.canSeeAge || f.canSeeFacility,
      canSeeName: f.canSeeName,
      canSeeAge: f.canSeeAge,
      canSeeFacility: f.canSeeFacility,
      capabilities: f.capabilities,
    });
    setSaving(false);
  };

  return (
    <div className="card">
      <div className="fc gap8 mb12" style={{ justifyContent: 'space-between' }}>
        <div className="ct">Editing: @{user.username} <span className={`badge ${roleColors[user.role] || 'b-muted'}`} style={{ marginLeft: 8 }}>{t.roles[user.role]}</span></div>
      </div>
      {err && <div className="al al-err mb12">{err}</div>}
      <div className="g2">
        <div className="f"><label className="lbl">{t.users.name}</label><input className="inp" value={f.name} onChange={(e) => u('name', e.target.value)} /></div>
        <div className="f"><label className="lbl">Email</label><input type="email" className="inp" value={f.email} onChange={(e) => u('email', e.target.value)} placeholder="user@example.com" /></div>
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
      <div className="card-inner mt12">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 6 }}>
          Patient personal data access
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginBottom: 10 }}>
          Grant per-field access. Useful when sharing limited views with a collaborator.
        </div>
        <label className="cbox"><input type="checkbox" checked={f.canSeeName} onChange={(e) => u('canSeeName', e.target.checked)} /><span className="cbox-lbl">Can view patient name</span></label>
        <label className="cbox"><input type="checkbox" checked={f.canSeeAge} onChange={(e) => u('canSeeAge', e.target.checked)} /><span className="cbox-lbl">Can view patient age</span></label>
        <label className="cbox"><input type="checkbox" checked={f.canSeeFacility} onChange={(e) => u('canSeeFacility', e.target.checked)} /><span className="cbox-lbl">Can view patient facility</span></label>
      </div>

      <div className="card-inner mt16">
        <div className="fb mb12">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.95rem', color: 'var(--tx)' }}>
              Capabilities
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--tx3)', marginTop: 2 }}>
              {capsCustomized ? 'Custom set — different from role defaults' : `Defaults for ${t.roles[f.role]} role`}
            </div>
          </div>
          {capsCustomized && (
            <button type="button" className="btn btn-bd btn-xs" onClick={resetToRoleDefaults}>
              Reset to role defaults
            </button>
          )}
        </div>
        {CAPABILITY_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              {group.label}
            </div>
            {group.items.map((cap) => (
              <label key={cap.id} className="cbox" style={{ marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={f.capabilities.includes(cap.id)}
                  onChange={() => toggleCap(cap.id)}
                />
                <span className="cbox-lbl" style={{ fontSize: '.85rem' }}>{cap.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>

      <div className="fc gap8 mt12" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-bd" onClick={onCancel} disabled={saving}>{t.pt.cancel}</button>
        <button className="btn btn-ac" onClick={save} disabled={saving}>{saving ? '...' : 'Save changes'}</button>
      </div>
    </div>
  );
}
