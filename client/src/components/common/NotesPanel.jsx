// Reusable notes / comments thread. Used in two places:
//   - PatientDetail: <NotesPanel patientId step="overall" /> for patient-wide notes
//   - Each WorkflowStep: <NotesPanel patientId step="consent" compact /> for per-step comments
//
// The `step` prop is sent to the API; the server treats 'overall' as
// "notes with NULL step column" and any other value as a literal step name.

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { NotesRepo } from '../../storage/repository.js';
import { hasCapability, CAPABILITIES } from '../../constants/capabilities.js';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `today ${time}` : `${d.toLocaleDateString()} ${time}`;
}

export default function NotesPanel({ patientId, step, compact = false, title = null, onCountChange = null }) {
  const { user } = useApp();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = hasCapability(user, CAPABILITIES.MANAGE_USERS);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await NotesRepo.list(patientId, step);
      setNotes(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [patientId, step]);

  useEffect(() => { reload(); }, [reload]);

  // Notify parent of count changes (used by PatientDetail to render a chip)
  useEffect(() => {
    if (onCountChange) onCountChange(notes.length);
  }, [notes.length, onCountChange]);

  const post = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setPosting(true);
    setError('');
    try {
      const stepArg = step === 'overall' ? null : step;
      const created = await NotesRepo.create(patientId, trimmed, stepArg);
      setNotes((prev) => [...prev, created]);
      setBody('');
    } catch (e) {
      setError(e.message || 'Failed to post note');
    } finally {
      setPosting(false);
    }
  };

  const remove = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await NotesRepo.remove(patientId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      alert(e.message || 'Failed to delete note');
    }
  };

  const onKeyDown = (e) => {
    // Cmd/Ctrl + Enter to post
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      post();
    }
  };

  const heading = title || (step === 'overall' || !step ? 'Notes' : 'Comments');
  const placeholder = step === 'overall' || !step
    ? 'Add a note about this patient — visible to anyone with patient access'
    : 'Add a comment on this step';

  return (
    <div className={compact ? 'card-inner' : 'card'} style={compact ? { marginTop: 12 } : {}}>
      <div className="fb" style={{ marginBottom: 8 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: compact ? '.82rem' : '.95rem',
          color: 'var(--tx)',
        }}>
          &#128172; {heading}
          {notes.length > 0 && <span style={{ color: 'var(--tx3)', fontWeight: 400, marginLeft: 6 }}>({notes.length})</span>}
        </div>
      </div>

      {loading && (
        <div style={{ color: 'var(--tx3)', fontSize: '.82rem', padding: '6px 0' }}>Loading…</div>
      )}

      {!loading && notes.length === 0 && (
        <div style={{ color: 'var(--tx3)', fontSize: '.82rem', padding: '6px 0' }}>
          No {step === 'overall' || !step ? 'notes' : 'comments'} yet.
        </div>
      )}

      {notes.map((n) => {
        const canDelete = n.authorId === user?.id || isAdmin;
        return (
          <div
            key={n.id}
            style={{
              padding: '8px 10px',
              borderLeft: '3px solid var(--ac)',
              background: 'var(--s2)',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            <div className="fb" style={{ marginBottom: 4, alignItems: 'flex-start' }}>
              <div style={{ fontSize: '.78rem', color: 'var(--tx2)' }}>
                <strong style={{ color: 'var(--tx)' }}>{n.authorName || 'Unknown'}</strong>
                <span style={{ color: 'var(--tx3)', marginLeft: 6 }}>{formatWhen(n.createdAt)}</span>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--tx3)', fontSize: '.75rem', padding: 0,
                  }}
                  title="Delete note"
                >
                  &times;
                </button>
              )}
            </div>
            <div style={{ fontSize: '.88rem', color: 'var(--tx)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {n.body}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 10 }}>
        <textarea
          className="tea"
          rows={compact ? 2 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{ width: '100%', resize: 'vertical' }}
        />
        {error && <div style={{ color: 'var(--err)', fontSize: '.78rem', marginTop: 4 }}>{error}</div>}
        <div className="fc gap8 mt6" style={{ justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '.7rem', color: 'var(--tx3)', alignSelf: 'center' }}>
            ⌘/Ctrl + Enter to post
          </span>
          <button
            type="button"
            className="btn btn-ac btn-sm"
            disabled={posting || !body.trim()}
            onClick={post}
          >
            {posting ? 'Posting…' : 'Post note'}
          </button>
        </div>
      </div>
    </div>
  );
}
