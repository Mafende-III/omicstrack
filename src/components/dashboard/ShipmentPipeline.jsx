import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { StepRepo } from '../../storage/repository.js';

export default function ShipmentPipeline({ onViewPatient }) {
  const { patients, t } = useApp();
  const [groups, setGroups] = useState({
    preCollection: [],
    processing: [],
    readyToShip: [],
    inTransit: [],
    received: [],
  });

  useEffect(() => {
    const result = {
      preCollection: [],
      processing: [],
      readyToShip: [],
      inTransit: [],
      received: [],
    };

    for (const p of patients) {
      const consent = StepRepo.getConsent(p.id);
      const quest = StepRepo.getQuestionnaire(p.id);
      const col = StepRepo.getCollection(p.id);
      const pbmc = StepRepo.getPbmc(p.id);
      const transfer = StepRepo.getTransfer(p.id);

      if (transfer?.receiptConfirmed) {
        result.received.push({ ...p, stepInfo: transfer });
      } else if (transfer?.submitted) {
        result.inTransit.push({ ...p, stepInfo: transfer });
      } else if (pbmc?.submitted) {
        result.readyToShip.push({ ...p, stepInfo: pbmc });
      } else if (col?.submitted) {
        result.processing.push({ ...p, stepInfo: col });
      } else {
        result.preCollection.push({ ...p, stepInfo: { consent: consent?.submitted, quest: quest?.submitted } });
      }
    }

    setGroups(result);
  }, [patients]);

  const columns = [
    { key: 'preCollection', label: t.shipPipeline.preCollection, items: groups.preCollection },
    { key: 'processing', label: t.shipPipeline.processing, items: groups.processing },
    { key: 'readyToShip', label: t.shipPipeline.readyToShip, items: groups.readyToShip },
    { key: 'inTransit', label: t.shipPipeline.inTransit, items: groups.inTransit, highlight: true },
    { key: 'received', label: t.shipPipeline.received, items: groups.received },
  ];

  return (
    <div className="card">
      <div className="ct">{t.shipPipeline.title}</div>
      <div className="pipeline">
        {columns.map((col) => (
          <div key={col.key} className={`pipe-col ${col.highlight ? 'highlight' : ''}`}>
            <div className="pipe-col-title">
              {col.label}
              <span className="pipe-count">{col.items.length}</span>
            </div>
            {col.items.length === 0 ? (
              <div style={{ fontSize: '.72rem', color: 'var(--tx3)', padding: '8px 0' }}>
                {t.shipPipeline.noPatients}
              </div>
            ) : (
              col.items.map((p) => (
                <div
                  key={p.id}
                  className="pipe-card"
                  onClick={() => onViewPatient(p)}
                >
                  <div className="fc gap6 mb6">
                    <span className="code-pill">{p.code}</span>
                    <span style={{ fontWeight: 600, fontSize: '.78rem' }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--tx2)' }}>
                    {p.facility} &middot; {p.leukemiaType}
                  </div>
                  {col.key === 'inTransit' && p.stepInfo?.totalVialsShipped > 0 && (
                    <div className="fc gap6 mt6">
                      <span className="badge b-ac" style={{ fontSize: '.62rem' }}>{p.stepInfo.totalVialsShipped} vials</span>
                      <span className="badge b-liege" style={{ fontSize: '.62rem' }}>{t.shipPipeline.confirmReceipt}</span>
                    </div>
                  )}
                  {col.key === 'readyToShip' && (
                    <div className="mt6">
                      <span className="badge b-muted" style={{ fontSize: '.62rem' }}>
                        {parseInt(StepRepo.getPbmc(p.id)?.vials, 10) || 0} vials
                      </span>
                    </div>
                  )}
                  {col.key === 'received' && p.stepInfo?.sampleCondition && (
                    <div className="mt6">
                      <span className={`badge ${p.stepInfo.sampleCondition === 'intact' ? 'b-ok' : 'b-warn'}`} style={{ fontSize: '.62rem' }}>
                        {p.stepInfo.sampleCondition}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
