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

const VIEW_ACCESS = {
  dashboard: ['admin', 'entry', 'viewer', 'liege'],
  patients: ['admin', 'entry', 'viewer', 'liege'],
  shipments: ['admin', 'entry', 'liege'],
  users: ['admin'],
  forms: ['admin'],
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
    const role = user?.role;
    const allowed = VIEW_ACCESS[v];
    if (allowed && !allowed.includes(role)) {
      setView('dashboard');
      setSelected(null);
      return;
    }
    setView(v);
    setSelected(null);
  }, [user?.role]);

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

  const role = user.role;

  const handleViewPatient = (patient) => {
    setSelected(patient);
    setView('patients');
  };

  // Enforce access: if current view is not allowed for role, redirect to dashboard
  const allowed = VIEW_ACCESS[view];
  const safeView = (allowed && !allowed.includes(role)) ? 'dashboard' : view;
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
          <Dashboard onViewPatient={handleViewPatient} />
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
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
