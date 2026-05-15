import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { TemplateRepo } from '../../storage/repository.js';

const LANGS = ['en', 'fr', 'ki'];
const LANG_LABELS = { en: 'English', fr: 'Français', ki: 'Kinyarwanda' };

// Per-language fields that are NOT sections (rendered above the sections list)
const FLAT_FIELDS = [
  { key: 'title', tKey: 'consentTitle', textarea: false },
  { key: 'studyTitle', tKey: 'studyTitle', textarea: true },
  { key: 'consentStatement', tKey: 'consentStatement', textarea: true },
  { key: 'consentSectionLabel', tKey: 'consentLabel', textarea: false },
  { key: 'participantLabel', tKey: 'participantLabel', textarea: false },
  { key: 'researcherLabel', tKey: 'researcherLabel', textarea: false },
  { key: 'signatureAndDate', tKey: 'signatureLabel', textarea: false },
  { key: 'doneAt', tKey: 'doneAtLabel', textarea: false },
];

function emptyLangContent() {
  return {
    title: '',
    studyTitle: '',
    sections: [],
    consentStatement: '',
    consentSectionLabel: '',
    participantLabel: '',
    researcherLabel: '',
    signatureAndDate: '',
    doneAt: '',
  };
}

// Deep clone helper without structuredClone caveats
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export default function ConsentEditor() {
  const { t, consentTemplate, refreshTemplates } = useApp();
  const [draft, setDraft] = useState(null);
  const [versions, setVersions] = useState([]);
  const [viewingVersionId, setViewingVersionId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [err, setErr] = useState('');

  // Load versions list
  useEffect(() => {
    TemplateRepo.listVersions('consent').then(setVersions).catch(() => {});
  }, [consentTemplate?.id]);

  // Initialize draft from active template
  useEffect(() => {
    if (!consentTemplate?.content) return;
    const initial = clone(consentTemplate.content);
    for (const lang of LANGS) {
      if (!initial[lang]) initial[lang] = emptyLangContent();
    }
    setDraft(initial);
  }, [consentTemplate?.id]);

  // Switch to viewing a historical version (read-only)
  const viewVersion = async (id) => {
    if (id === consentTemplate?.id || !id) {
      setViewingVersionId(null);
      return;
    }
    try {
      const v = await TemplateRepo.getVersion('consent', id);
      const content = clone(v.content);
      for (const lang of LANGS) {
        if (!content[lang]) content[lang] = emptyLangContent();
      }
      setDraft(content);
      setViewingVersionId(id);
    } catch {
      setErr('Failed to load version');
    }
  };

  const backToActive = () => {
    if (!consentTemplate?.content) return;
    const initial = clone(consentTemplate.content);
    for (const lang of LANGS) {
      if (!initial[lang]) initial[lang] = emptyLangContent();
    }
    setDraft(initial);
    setViewingVersionId(null);
  };

  const isViewing = !!viewingVersionId;
  const isDirty = !isViewing && draft && consentTemplate?.content &&
    JSON.stringify(draft) !== JSON.stringify(consentTemplate.content);

  const updateFlat = (lang, field, value) => {
    setDraft((d) => ({ ...d, [lang]: { ...d[lang], [field]: value } }));
  };

  const updateSection = (lang, sectionIndex, key, value) => {
    setDraft((d) => {
      const next = clone(d);
      next[lang].sections[sectionIndex][key] = value;
      return next;
    });
  };

  // Section structure is duplicated per language. When we add/remove sections, do it
  // in all three languages at once to keep them aligned.
  const addSection = () => {
    setDraft((d) => {
      const next = clone(d);
      const sectionKey = `s_${Date.now()}`;
      for (const lang of LANGS) {
        next[lang].sections.push({ key: sectionKey, heading: '', body: '' });
      }
      return next;
    });
  };

  const removeSection = (sectionIndex) => {
    setDraft((d) => {
      const next = clone(d);
      for (const lang of LANGS) {
        next[lang].sections.splice(sectionIndex, 1);
      }
      return next;
    });
  };

  const moveSection = (sectionIndex, dir) => {
    const targetIndex = sectionIndex + dir;
    if (targetIndex < 0) return;
    setDraft((d) => {
      const next = clone(d);
      for (const lang of LANGS) {
        const arr = next[lang].sections;
        if (targetIndex >= arr.length) return d;
        [arr[sectionIndex], arr[targetIndex]] = [arr[targetIndex], arr[sectionIndex]];
      }
      return next;
    });
  };

  const doPublish = async () => {
    setErr('');
    setPublishing(true);
    try {
      await TemplateRepo.publishVersion('consent', draft);
      await refreshTemplates();
      const list = await TemplateRepo.listVersions('consent');
      setVersions(list);
      setConfirmOpen(false);
    } catch (e) {
      setErr(e.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  if (!draft) {
    return <div style={{ color: 'var(--tx2)', fontSize: '.88rem' }}>{t.misc.loading}</div>;
  }

  // Section count is the same across languages (we keep them aligned)
  const sectionCount = draft.en?.sections?.length || 0;

  return (
    <div>
      {/* Version banner */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="fb" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '.78rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {t.forms.currentVersion}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tx)', marginTop: 2 }}>
              v{consentTemplate?.version} &middot;{' '}
              <span style={{ color: 'var(--tx2)', fontWeight: 400 }}>
                {t.forms.publishedAt}{' '}
                {consentTemplate?.publishedAt ? new Date(consentTemplate.publishedAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>
          <div className="fc gap8">
            {isViewing && (
              <>
                <span className="badge b-muted">
                  {t.forms.previewActive.replace('{v}', versions.find((v) => v.id === viewingVersionId)?.version ?? '?')}
                </span>
                <button className="btn btn-bd btn-sm" onClick={backToActive}>
                  {t.forms.backToActive}
                </button>
              </>
            )}
            {!isViewing && isDirty && <span className="badge b-warn">{t.forms.changedBadge}</span>}
            {!isViewing && !isDirty && <span className="badge b-muted">{t.forms.unchanged}</span>}
            {!isViewing && (
              <button
                className="btn btn-ac"
                disabled={!isDirty || publishing}
                onClick={() => setConfirmOpen(true)}
              >
                {publishing ? t.forms.publishing : t.forms.publish}
              </button>
            )}
          </div>
        </div>
        {err && <div className="al al-err mt8">{err}</div>}
      </div>

      {/* Flat fields (per-language) */}
      {FLAT_FIELDS.map((f) => (
        <div className="card" key={f.key} style={{ marginBottom: 12 }}>
          <div className="ct" style={{ marginBottom: 8 }}>{t.forms[f.tKey]}</div>
          <div className="lang-grid">
            {LANGS.map((lang) => (
              <div key={lang} className="lang-col">
                <div className="lang-tag">{LANG_LABELS[lang]}</div>
                {f.textarea ? (
                  <textarea
                    className="tea"
                    value={draft[lang][f.key] || ''}
                    onChange={(e) => updateFlat(lang, f.key, e.target.value)}
                    disabled={isViewing}
                    rows={f.key === 'studyTitle' ? 2 : 5}
                  />
                ) : (
                  <input
                    className="inp"
                    type="text"
                    value={draft[lang][f.key] || ''}
                    onChange={(e) => updateFlat(lang, f.key, e.target.value)}
                    disabled={isViewing}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sections list */}
      <div style={{ marginTop: 24, marginBottom: 12 }}>
        <div className="fb" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tx)' }}>
            Sections ({sectionCount})
          </div>
          {!isViewing && (
            <button className="btn btn-bd btn-sm" onClick={addSection}>
              + {t.forms.addSection}
            </button>
          )}
        </div>
      </div>

      {Array.from({ length: sectionCount }).map((_, i) => (
        <div className="card" key={i} style={{ marginBottom: 12 }}>
          <div className="fb" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--tx2)' }}>
              Section {i + 1}
            </div>
            {!isViewing && (
              <div className="fc gap6">
                <button className="btn btn-bd btn-sm" onClick={() => moveSection(i, -1)} disabled={i === 0}>↑</button>
                <button className="btn btn-bd btn-sm" onClick={() => moveSection(i, 1)} disabled={i === sectionCount - 1}>↓</button>
                <button className="btn btn-bd btn-sm" onClick={() => removeSection(i)}>{t.forms.removeSection}</button>
              </div>
            )}
          </div>

          {/* Heading row */}
          <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
            {t.forms.sectionHeading}
          </div>
          <div className="lang-grid" style={{ marginBottom: 12 }}>
            {LANGS.map((lang) => (
              <div key={lang} className="lang-col">
                <div className="lang-tag">{LANG_LABELS[lang]}</div>
                <input
                  className="inp"
                  type="text"
                  value={draft[lang].sections[i]?.heading || ''}
                  onChange={(e) => updateSection(lang, i, 'heading', e.target.value)}
                  disabled={isViewing}
                />
              </div>
            ))}
          </div>

          {/* Body row */}
          <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
            {t.forms.sectionBody}
          </div>
          <div className="lang-grid">
            {LANGS.map((lang) => (
              <div key={lang} className="lang-col">
                <div className="lang-tag">{LANG_LABELS[lang]}</div>
                <textarea
                  className="tea"
                  value={draft[lang].sections[i]?.body || ''}
                  onChange={(e) => updateSection(lang, i, 'body', e.target.value)}
                  disabled={isViewing}
                  rows={6}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Version history */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>
          {t.forms.versionHistory}
        </div>
        <div className="card">
          {versions.length === 0 && (
            <div style={{ color: 'var(--tx3)', fontSize: '.88rem' }}>—</div>
          )}
          {versions.map((v) => (
            <div key={v.id} className="fb" style={{ padding: '6px 0', borderBottom: '1px solid var(--bd)' }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--tx)' }}>v{v.version}</span>
                {v.isActive && <span className="badge b-ok" style={{ marginLeft: 8 }}>active</span>}
                <span style={{ marginLeft: 12, color: 'var(--tx2)', fontSize: '.85rem' }}>
                  {v.publishedAt ? new Date(v.publishedAt).toLocaleString() : '—'}
                  {v.createdByName && ` · ${v.createdByName}`}
                </span>
              </div>
              {!v.isActive && (
                <button className="btn btn-bd btn-sm" onClick={() => viewVersion(v.id)}>
                  {viewingVersionId === v.id ? t.forms.closeVersion : t.forms.viewVersion}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Publish confirmation modal */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => !publishing && setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="ct">{t.forms.publish}</div>
            <div style={{ fontSize: '.88rem', color: 'var(--tx2)', lineHeight: 1.6, margin: '8px 0 16px' }}>
              {t.forms.publishConfirm}
            </div>
            <div className="fc gap8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-bd" onClick={() => setConfirmOpen(false)} disabled={publishing}>
                {t.forms.cancel}
              </button>
              <button className="btn btn-ac" onClick={doPublish} disabled={publishing}>
                {publishing ? t.forms.publishing : t.forms.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
