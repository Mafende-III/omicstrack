import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const OBJECTIVES = [
  { num: '01', key: 'obj1' },
  { num: '02', key: 'obj2' },
  { num: '03', key: 'obj3' },
];

const OBJ_TEXT = {
  en: {
    obj1: { title: 'Classify Leukemia Types', desc: 'Identify and categorize leukemia subtypes within the Rwandan population using advanced diagnostic methods' },
    obj2: { title: 'Multi-Omics Characterization', desc: 'Comprehensive genomic, transcriptomic, and epigenomic profiling of leukemia samples' },
    obj3: { title: 'Epigenetic Impact on Treatment', desc: 'Evaluate how epigenetic modifications influence treatment response and patient outcomes' },
  },
  fr: {
    obj1: { title: 'Classifier les types de leucémie', desc: 'Identifier et catégoriser les sous-types dans la population rwandaise' },
    obj2: { title: 'Caractérisation multi-omique', desc: 'Profilage génomique, transcriptomique et épigénomique complet' },
    obj3: { title: 'Impact épigénétique sur le traitement', desc: 'Évaluer les modifications épigénétiques sur la réponse au traitement' },
  },
  ki: {
    obj1: { title: 'Gutondeka ubwoko bwa leukemia', desc: 'Kumenya no gutondeka ubwoko butandukanye mu baturage b\'u Rwanda' },
    obj2: { title: 'Isesengura rya multi-omics', desc: 'Gusuzuma genomike, transcriptomike na epigenomike byuzuye' },
    obj3: { title: 'Ingaruka z\'epigenetike ku buvuzi', desc: 'Gusuzuma uko impinduka za epigenetike zigira ingaruka ku buvuzi' },
  },
};

function DNAHelix() {
  return (
    <svg className="dna-helix" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C12 4 36 14 36 32C36 50 12 60 12 60" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M36 4C36 4 12 14 12 32C12 50 36 60 36 60" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {[12, 20, 28, 36, 44, 52].map((y, i) => {
        const progress = (y - 4) / 56;
        const x1 = 12 + 24 * Math.sin(progress * Math.PI);
        const x2 = 36 - 24 * Math.sin(progress * Math.PI);
        return (
          <line key={i} x1={Math.min(x1, x2)} y1={y} x2={Math.max(x1, x2)} y2={y}
            stroke="var(--ac)" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        );
      })}
      <circle cx="12" cy="4" r="2.5" fill="var(--ac)" opacity="0.7" />
      <circle cx="36" cy="4" r="2.5" fill="var(--liege-c)" opacity="0.7" />
      <circle cx="36" cy="32" r="2.5" fill="var(--ac)" opacity="0.7" />
      <circle cx="12" cy="32" r="2.5" fill="var(--liege-c)" opacity="0.7" />
      <circle cx="12" cy="60" r="2.5" fill="var(--ac)" opacity="0.7" />
      <circle cx="36" cy="60" r="2.5" fill="var(--liege-c)" opacity="0.7" />
    </svg>
  );
}

export default function LoginPage() {
  const { t, lang, setLang, login, users } = useApp();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const usr = users.find((x) => x.username === u && x.password === p);
    if (usr) login(usr);
    else setErr(t.login.err);
  };

  const kd = (e) => { if (e.key === 'Enter') submit(); };
  const obj = OBJ_TEXT[lang] || OBJ_TEXT.en;

  const marqueeItems = [...OBJECTIVES, ...OBJECTIVES];

  return (
    <div className="login-bg">
      <div className="login-hero fade">
        <div className="hero-brand">
          <DNAHelix />
          <div className="hero-brand-text">OmicsTrack</div>
        </div>

        <div className="hero-pill">PhD Research Study &middot; Rwanda</div>

        <h1 className="hero-title">
          Characterization of Omics Perturbations<br />
          Driving Leukemia in the Rwandan Population
        </h1>

        <div className="hero-pi">
          <span className="hero-pi-name">Esperance Umumararungu</span>
          <span className="hero-pi-role">
            Director, Molecular &amp; Genomics Unit &middot; NRL Rwanda
            <br />
            PhD Candidate &middot; Laboratory of Viral Interactomes, GIGA-CMB &middot; Universit&eacute; de Li&egrave;ge
          </span>
        </div>

        <div className="hero-collab">
          National Reference Laboratory, Kigali &middot; Universit&eacute; de Li&egrave;ge, Belgium &middot; GIGA Research Centre
        </div>

        <div className="marquee-container">
          <div className="marquee-track">
            {marqueeItems.map((item, idx) => (
              <div className="marquee-card" key={idx}>
                <div className="marquee-num">{item.num}</div>
                <div className="marquee-card-title">{obj[item.key].title}</div>
                <div className="marquee-card-desc">{obj[item.key].desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-card">
            <div className="fc gap6 mb16" style={{ justifyContent: 'center' }}>
              {['en', 'fr', 'ki'].map((l) => (
                <button
                  key={l}
                  className={`lang-btn ${lang === l ? 'on' : ''}`}
                  onClick={() => setLang(l)}
                >
                  {t.lang[l]}
                </button>
              ))}
            </div>
            {err && <div className="al al-err">{err}</div>}
            <div className="f">
              <label className="lbl">{t.login.user}</label>
              <input
                className="inp"
                value={u}
                onChange={(e) => setU(e.target.value)}
                onKeyDown={kd}
                autoComplete="username"
                placeholder="e.g. esperance"
              />
            </div>
            <div className="f">
              <label className="lbl">{t.login.pass}</label>
              <input
                type="password"
                className="inp"
                value={p}
                onChange={(e) => setP(e.target.value)}
                onKeyDown={kd}
                autoComplete="current-password"
              />
            </div>
            <button
              className="btn btn-ac"
              style={{ width: '100%', marginTop: 4, justifyContent: 'center', padding: '12px' }}
              onClick={submit}
            >
              {t.login.btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
