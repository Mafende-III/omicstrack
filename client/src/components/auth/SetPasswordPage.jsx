import { useState, useEffect } from 'react';
import { api } from '../../storage/engine.js';
import { useApp } from '../../context/AppContext.jsx';

export default function SetPasswordPage({ token, onComplete }) {
  const { t } = useApp();
  const [state, setState] = useState({ loading: true, valid: false, userName: '', role: '', expiresAt: null, error: '' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/auth/setup-token/${token}`);
        if (cancelled) return;
        setState({ loading: false, valid: true, ...data, error: '' });
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, valid: false, error: err.message || 'Invalid setup link' });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const submit = async () => {
    setSubmitError('');
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setSubmitError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post('/auth/setup-password', { token, password });
      // The server returns { accessToken, user } — set the token and redirect into the app
      api.setToken(result.accessToken);
      // Clear the URL token so a refresh doesn't try to re-use it
      window.history.replaceState({}, '', '/');
      onComplete?.(result.user);
    } catch (err) {
      setSubmitError(err.message || 'Failed to set password');
      setSubmitting(false);
    }
  };

  if (state.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--tx2)', fontSize: '.9rem' }}>Verifying setup link…</div>
      </div>
    );
  }

  if (!state.valid) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--tx)' }}>OmicsTrack</div>
          </div>
          <div className="al al-err" style={{ marginBottom: 16 }}>
            {state.error || 'This setup link is invalid, expired, or has already been used.'}
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--tx2)', lineHeight: 1.6 }}>
            If you need a fresh invitation, please contact your administrator.
          </p>
          <button className="btn btn-bd btn-block" onClick={() => { window.location.href = '/'; }} style={{ marginTop: 16 }}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--tx)' }}>OmicsTrack</div>
          <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginTop: 4 }}>Set your password</div>
        </div>

        <div style={{ background: 'var(--s2)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--bd)', marginBottom: 20 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Welcome</div>
          <div style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--tx)' }}>{state.userName}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--tx2)', marginTop: 4 }}>
            Username: <strong>{state.username}</strong> · Role: <strong>{roleLabel(state.role, t)}</strong>
          </div>
        </div>

        {submitError && <div className="al al-err" style={{ marginBottom: 12 }}>{submitError}</div>}

        <div className="f mb12">
          <label className="lbl">New password</label>
          <input
            type="password"
            className="inp"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={submitting}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="f mb16">
          <label className="lbl">Confirm password</label>
          <input
            type="password"
            className="inp"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
        </div>

        <button
          className="btn btn-ac btn-block"
          onClick={submit}
          disabled={submitting || !password || !confirm}
        >
          {submitting ? 'Setting password…' : 'Set password & sign in'}
        </button>

        <p style={{ fontSize: '.78rem', color: 'var(--tx3)', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
          This link is valid until {state.expiresAt ? new Date(state.expiresAt).toLocaleString() : 'soon'}
        </p>
      </div>
    </div>
  );
}

function roleLabel(role, t) {
  return t?.roles?.[role] || role;
}
