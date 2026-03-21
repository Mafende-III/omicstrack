import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function Header() {
  const { t, lang, setLang, user, logout } = useApp();
  const [dd, setDd] = useState(false);

  const roleClass = {
    admin: '', entry: 'entry', viewer: 'viewer', liege: 'liege',
  };

  return (
    <div className="hdr">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="1.5" />
            <path d="M4 7h6M7 4v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        {t.app}
      </div>
      <div className="hdr-r">
        {(user?.role === 'viewer') && (
          <span className="badge b-viewer" style={{ fontSize: '0.62rem' }}>
            {t.roleBanner.viewOnly}
          </span>
        )}
        <div style={{ position: 'relative' }}>
          <button className="lang-btn" onClick={() => setDd((d) => !d)}>
            {t.lang[lang]} &#9662;
          </button>
          {dd && (
            <div className="lang-dd">
              {['en', 'fr', 'ki'].map((l) => (
                <button
                  key={l}
                  className={`lang-opt ${lang === l ? 'on' : ''}`}
                  onClick={() => { setLang(l); setDd(false); }}
                >
                  {t.lang[l]}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className={`role-tag ${roleClass[user?.role] || ''}`}>
          {t.roles[user?.role]}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          {t.misc.logout}
        </button>
      </div>
    </div>
  );
}
