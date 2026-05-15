import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import ConsentEditor from './ConsentEditor.jsx';
import QuestionnaireEditor from './QuestionnaireEditor.jsx';

export default function FormsManagement() {
  const { t } = useApp();
  const [tab, setTab] = useState('consent');

  return (
    <div className="fade">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tx)', margin: 0 }}>
          {t.forms.title}
        </h1>
        <div style={{ fontSize: '.88rem', color: 'var(--tx2)', marginTop: 4 }}>
          {t.forms.subtitle}
        </div>
      </div>

      <div className="tog" style={{ marginBottom: 16 }}>
        <button className={`tog-o ${tab === 'consent' ? 'on' : ''}`} onClick={() => setTab('consent')}>
          {t.forms.consentTab}
        </button>
        <button
          className={`tog-o ${tab === 'questionnaire' ? 'on' : ''}`}
          onClick={() => setTab('questionnaire')}
        >
          {t.forms.questionnaireTab}
        </button>
      </div>

      {tab === 'consent' ? <ConsentEditor /> : <QuestionnaireEditor />}
    </div>
  );
}
