import { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import LoginPage from './components/auth/LoginPage.jsx';
import SetPasswordPage from './components/auth/SetPasswordPage.jsx';
import Header from './components/layout/Header.jsx';
import Navigation from './components/layout/Navigation.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import PatientList from './components/patients/PatientList.jsx';
import PatientDetail from './components/patients/PatientDetail.jsx';
import ShipmentHub from './components/shipments/ShipmentHub.jsx';
import UserManagement from './components/users/UserManagement.jsx';
import FormsManagement from './components/admin/FormsManagement.jsx';
import { hasCapability, CAPABILITIES } from './constants/capabilities.js';

// Each view requires at least ONE of these capabilities. Dashboard is always
// available to any authenticated user; everything else is capability-gated.
const VIEW_CAPS = {
  dashboard: null, // always accessible
  patients: [CAPABILITIES.VIEW_PATIENTS],
  shipments: [CAPABILITIES.CREATE_SHIPMENT, CAPABILITIES.RECEIVE_SHIPMENT],
  users: [CAPABILITIES.MANAGE_USERS],
  forms: [CAPABILITIES.EDIT_FORMS],
};

function getSetupTokenFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.pathname === '/set-password' || url.searchParams.has('token')) {
      const token = url.searchParams.get('token');
      if (token && token.length >= 20) return token;
    }
  } catch {
    // ignore malformed URL
  }
  return null;
}

function AppContent() {
  const { user, t, ready } = useApp();
  const [view, setView] = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [setupToken, setSetupToken] = useState(getSetupTokenFromUrl);

  useEffect(() => {
    // If the URL had a setup token but we've already got a logged-in user,
    // clear the token state so the regular app renders.
    if (user && setupToken) setSetupToken(null);
  }, [user, setupToken]);

  const guardedSetView = useCallback((v) => {
    const required = VIEW_CAPS[v];
    if (required && !required.some((cap) => hasCapability(user, cap))) {
      setView('dashboard');
      setSelected(null);
      return;
    }
    setView(v);
    setSelected(null);
  }, [user]);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--tx2)', fontSize: '.9rem',
      }}>
        {t.misc.loading}
      </div>
    );
  }

  // Setup link from welcome email takes priority over login page
  if (setupToken && !user) {
    return (
      <SetPasswordPage
        token={setupToken}
        onComplete={async () => {
          // After successful password set + auto-login, refresh app state
          setSetupToken(null);
          // Force a reload to fully bootstrap the AppContext (user, patients, templates)
          window.location.href = '/';
        }}
      />
    );
  }

  if (!user) return <LoginPage />;

  const handleViewPatient = (patient) => {
    setSelected(patient);
    setView('patients');
  };

  // Enforce access: if current view requires a capability the user lacks, redirect to dashboard
  const required = VIEW_CAPS[view];
  const allowedByCap = !required || required.some((cap) => hasCapability(user, cap));
  const safeView = allowedByCap ? view : 'dashboard';
  const activeView = selected ? 'patients' : safeView;

  return (
    <div className="app">
      <Header />
      <Navigation
        view={activeView}
        setView={guardedSetView}
      />
      <div className="main">
        {selected ? (
          <PatientDetail
            patient={selected}
            onBack={() => { setSelected(null); setView('patients'); }}
          />
        ) : safeView === 'dashboard' ? (
          <Dashboard onViewPatient={handleViewPatient} onNavigate={guardedSetView} />
        ) : safeView === 'patients' ? (
          <PatientList onSelect={handleViewPatient} />
        ) : safeView === 'shipments' ? (
          <ShipmentHub onViewPatient={handleViewPatient} />
        ) : safeView === 'users' ? (
          <UserManagement />
        ) : safeView === 'forms' ? (
          <FormsManagement />
        ) : null}
      </div>
      <AppFooter />
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      &copy; 2026 OmicsTrack
      <span className="sep">&middot;</span>
      Built by{' '}
      <a href="https://www.streamlinexperts.rw" target="_blank" rel="noopener noreferrer">
        StreamlineXperts
      </a>
    </footer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
