import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function Navigation({ view, setView }) {
  const { t, user } = useApp();
  const role = user?.role;

  const items = [
    { k: 'dashboard', l: t.nav.dash, icon: '\u25A6' },
    { k: 'patients', l: t.nav.patients, icon: '\u2630' },
    ...(['admin', 'entry', 'liege'].includes(role) ? [{ k: 'shipments', l: t.nav.shipments, icon: '\u2708' }] : []),
    ...(role === 'admin' ? [{ k: 'forms', l: t.nav.forms, icon: '\u270e' }] : []),
    ...(role === 'admin' ? [{ k: 'users', l: t.nav.users, icon: '\u2605' }] : []),
  ];

  // Sliding indicator
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[view];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [view, items.length]);

  return (
    <>
      {/* Desktop top tabs */}
      <div className="nav-wrap">
        <div className="nav">
          <div
            className="nav-indicator"
            style={{ left: indicator.left, width: indicator.width }}
          />
          {items.map((i) => (
            <button
              key={i.k}
              ref={(el) => { tabRefs.current[i.k] = el; }}
              className={`nav-tab ${view === i.k ? 'on' : ''}`}
              onClick={() => setView(i.k)}
            >
              {i.l}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-inner">
          {items.map((i) => (
            <button
              key={i.k}
              className={`mnav-btn ${view === i.k ? 'on' : ''}`}
              onClick={() => setView(i.k)}
            >
              <span className="mnav-icon">{i.icon}</span>
              <span className="mnav-lbl">{i.l}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
