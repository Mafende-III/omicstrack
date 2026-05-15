import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { TemplateRepo } from '../../storage/repository.js';

const LANGS = ['en', 'fr', 'ki'];
const LANG_LABELS = { en: 'English', fr: 'Français', ki: 'Kinyarwanda' };
const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'select'];

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function makeEmptyField() {
  return {
    id: `q_${Date.now()}`,
    type: 'text',
    required: false,
    options: [],
    labels: { en: '', fr: '', ki: '' },
  };
}

function makeEmptySection(keySuffix) {
  return {
    key: keySuffix,
    labels: { en: '', fr: '', ki: '' },
    fields: [],
  };
}

export default function QuestionnaireEditor() {
  const { t, questionnaireTemplate, refreshTemplates } = useApp();
  const [draft, setDraft] = useState(null);
  const [versions, setVersions] = useState([]);
  const [viewingVersionId, setViewingVersionId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    TemplateRepo.listVersions('questionnaire').then(setVersions).catch(() => {});
  }, [questionnaireTemplate?.id]);

  useEffect(() => {
    if (!questionnaireTemplate?.content) return;
    setDraft(clone(questionnaireTemplate.content));
  }, [questionnaireTemplate?.id]);

  const viewVersion = async (id) => {
    if (!id || id === questionnaireTemplate?.id) {
      setViewingVersionId(null);
      return;
    }
    try {
      const v = await TemplateRepo.getVersion('questionnaire', id);
      setDraft(clone(v.content));
      setViewingVersionId(id);
    } catch {
      setErr('Failed to load version');
    }
  };

  const backToActive = () => {
    if (!questionnaireTemplate?.content) return;
    setDraft(clone(questionnaireTemplate.content));
    setViewingVersionId(null);
  };

  const isViewing = !!viewingVersionId;
  const isDirty = !isViewing && draft && questionnaireTemplate?.content &&
    JSON.stringify(draft) !== JSON.stringify(questionnaireTemplate.content);

  const updateSectionLabel = (sIdx, lang, value) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections[sIdx].labels[lang] = value;
      return next;
    });
  };

  const updateSectionKey = (sIdx, value) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections[sIdx].key = value;
      return next;
    });
  };

  const addSection = () => {
    setDraft((d) => {
      const next = clone(d);
      next.sections.push(makeEmptySection(`S${Date.now()}`));
      return next;
    });
  };

  const removeSection = (sIdx) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections.splice(sIdx, 1);
      return next;
    });
  };

  const moveSection = (sIdx, dir) => {
    const target = sIdx + dir;
    setDraft((d) => {
      const next = clone(d);
      if (target < 0 || target >= next.sections.length) return d;
      [next.sections[sIdx], next.sections[target]] = [next.sections[target], next.sections[sIdx]];
      return next;
    });
  };

  const addField = (sIdx) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections[sIdx].fields.push(makeEmptyField());
      return next;
    });
  };

  const removeField = (sIdx, fIdx) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections[sIdx].fields.splice(fIdx, 1);
      return next;
    });
  };

  const moveField = (sIdx, fIdx, dir) => {
    const target = fIdx + dir;
    setDraft((d) => {
      const next = clone(d);
      const arr = next.sections[sIdx].fields;
      if (target < 0 || target >= arr.length) return d;
      [arr[fIdx], arr[target]] = [arr[target], arr[fIdx]];
      return next;
    });
  };

  const updateField = (sIdx, fIdx, key, value) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections[sIdx].fields[fIdx][key] = value;
      return next;
    });
  };

  const updateFieldLabel = (sIdx, fIdx, lang, value) => {
    setDraft((d) => {
      const next = clone(d);
      next.sections[sIdx].fields[fIdx].labels[lang] = value;
      return next;
    });
  };

  const doPublish = async () => {
    setErr('');
    setPublishing(true);
    try {
      await TemplateRepo.publishVersion('questionnaire', draft);
      await refreshTemplates();
      const list = await TemplateRepo.listVersions('questionnaire');
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

  const sections = draft.sections || [];

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
              v{questionnaireTemplate?.version} &middot;{' '}
              <span style={{ color: 'var(--tx2)', fontWeight: 400 }}>
                {t.forms.publishedAt}{' '}
                {questionnaireTemplate?.publishedAt
                  ? new Date(questionnaireTemplate.publishedAt).toLocaleString()
                  : '—'}
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

      {/* Sections */}
      <div style={{ marginBottom: 12 }} className="fb">
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tx)' }}>
          Sections ({sections.length})
        </div>
        {!isViewing && (
          <button className="btn btn-bd btn-sm" onClick={addSection}>+ {t.forms.addSection}</button>
        )}
      </div>

      {sections.map((sec, sIdx) => (
        <div className="card" key={sIdx} style={{ marginBottom: 16 }}>
          <div className="fb" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--tx2)' }}>
              Section {sIdx + 1}
            </div>
            {!isViewing && (
              <div className="fc gap6">
                <button className="btn btn-bd btn-sm" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}>↑</button>
                <button className="btn btn-bd btn-sm" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === sections.length - 1}>↓</button>
                <button className="btn btn-bd btn-sm" onClick={() => removeSection(sIdx)}>{t.forms.removeSection}</button>
              </div>
            )}
          </div>

          {/* Section key (shared, e.g. "A") */}
          <div className="f">
            <label className="lbl">Key</label>
            <input
              className="inp"
              type="text"
              value={sec.key || ''}
              onChange={(e) => updateSectionKey(sIdx, e.target.value)}
              disabled={isViewing}
              style={{ maxWidth: 120 }}
            />
          </div>

          {/* Section labels per lang */}
          <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 8, marginBottom: 4 }}>
            Label
          </div>
          <div className="lang-grid" style={{ marginBottom: 12 }}>
            {LANGS.map((lang) => (
              <div key={lang} className="lang-col">
                <div className="lang-tag">{LANG_LABELS[lang]}</div>
                <input
                  className="inp"
                  type="text"
                  value={sec.labels?.[lang] || ''}
                  onChange={(e) => updateSectionLabel(sIdx, lang, e.target.value)}
                  disabled={isViewing}
                />
              </div>
            ))}
          </div>

          {/* Fields */}
          <div style={{ borderTop: '1px solid var(--bd)', margin: '12px 0' }} />

          <div className="fb" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--tx)' }}>
              Fields ({sec.fields.length})
            </div>
            {!isViewing && (
              <button className="btn btn-bd btn-sm" onClick={() => addField(sIdx)}>
                + {t.forms.addField}
              </button>
            )}
          </div>

          {sec.fields.map((f, fIdx) => (
            <div
              key={fIdx}
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--bd)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div className="fb" style={{ alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '.78rem', color: 'var(--tx3)' }}>
                  Field {fIdx + 1}
                </div>
                {!isViewing && (
                  <div className="fc gap6">
                    <button className="btn btn-bd btn-sm" onClick={() => moveField(sIdx, fIdx, -1)} disabled={fIdx === 0}>↑</button>
                    <button className="btn btn-bd btn-sm" onClick={() => moveField(sIdx, fIdx, 1)} disabled={fIdx === sec.fields.length - 1}>↓</button>
                    <button className="btn btn-bd btn-sm" onClick={() => removeField(sIdx, fIdx)}>{t.forms.removeField}</button>
                  </div>
                )}
              </div>

              {/* Shared field props */}
              <div className="g2" style={{ marginBottom: 8 }}>
                <div className="f">
                  <label className="lbl">{t.forms.fieldId}</label>
                  <input
                    className="inp"
                    type="text"
                    value={f.id || ''}
                    onChange={(e) => updateField(sIdx, fIdx, 'id', e.target.value)}
                    disabled={isViewing}
                  />
                </div>
                <div className="f">
                  <label className="lbl">{t.forms.fieldType}</label>
                  <select
                    className="sel"
                    value={f.type || 'text'}
                    onChange={(e) => updateField(sIdx, fIdx, 'type', e.target.value)}
                    disabled={isViewing}
                  >
                    {FIELD_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
              </div>

              {f.type === 'select' && (
                <div className="f" style={{ marginBottom: 8 }}>
                  <label className="lbl">{t.forms.fieldOptions}</label>
                  <input
                    className="inp"
                    type="text"
                    value={(f.options || []).join(', ')}
                    onChange={(e) => updateField(sIdx, fIdx, 'options', e.target.value.split(',').map((o) => o.trim()).filter(Boolean))}
                    disabled={isViewing}
                  />
                </div>
              )}

              {/* Per-language labels */}
              <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>
                Label
              </div>
              <div className="lang-grid">
                {LANGS.map((lang) => (
                  <div key={lang} className="lang-col">
                    <div className="lang-tag">{LANG_LABELS[lang]}</div>
                    <input
                      className="inp"
                      type="text"
                      value={f.labels?.[lang] || ''}
                      onChange={(e) => updateFieldLabel(sIdx, fIdx, lang, e.target.value)}
                      disabled={isViewing}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
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

      {/* Publish confirmation */}
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
