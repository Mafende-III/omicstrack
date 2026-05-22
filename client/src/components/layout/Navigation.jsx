import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';

export default function Navigation({ view, setView }) {
  const { t, user } = useApp();

  const canPatients = hasCapability(user, CAPABILITIES.VIEW_PATIENTS);
  const canShipments = hasCapability(user, CAPABILITIES.CREATE_SHIPMENT) || hasCapability(user, CAPABILITIES.RECEIVE_SHIPMENT);
  const canForms = hasCapability(user, CAPABILITIES.EDIT_FORMS);
  const canUsers = hasCapability(user, CAPABILITIES.MANAGE_USERS);

  const items = [
    { k: 'dashboard', l: t.nav.dash, icon: '\u25A6' },
    ...(canPatients ? [{ k: 'patients', l: t.nav.patients, icon: '\u2630' }] : []),
    ...(canShipments ? [{ k: 'shipments', l: t.nav.shipments, icon: '\u2708' }] : []),
    ...(canForms ? [{ k: 'forms', l: t.nav.forms, icon: '\u270e' }] : []),
    ...(canUsers ? [{ k: 'users', l: t.nav.users, icon: '\u2605' }] : []),
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
