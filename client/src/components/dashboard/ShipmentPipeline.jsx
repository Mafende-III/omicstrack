import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { api } from '../../storage/engine.js';
import { canSeeField } from '../../utils/pii.js';

export default function ShipmentPipeline({ onViewPatient }) {
  const { patients, t, user } = useApp();
  const [groups, setGroups] = useState({
    preCollection: [],
    processing: [],
    readyToShip: [],
    inTransit: [],
    received: [],
  });

  useEffect(() => {
    (async () => {
      const result = {
        preCollection: [],
        processing: [],
        readyToShip: [],
        inTransit: [],
        received: [],
      };

      // Fetch all step statuses in parallel
      const stepPromises = patients.map(async (p) => {
        try {
          const detail = await api.get(`/patients/${p.id}`);
          return { patient: p, steps: detail?.steps || {} };
        } catch {
          return { patient: p, steps: {} };
        }
      });

      const results = await Promise.all(stepPromises);

      for (const { patient: p, steps } of results) {
        if (steps.receiptConfirmed) {
          result.received.push(p);
        } else if (steps.transfer) {
          result.inTransit.push(p);
        } else if (steps.pbmc) {
          result.readyToShip.push(p);
        } else if (steps.collection) {
          result.processing.push(p);
        } else {
          result.preCollection.push(p);
        }
      }

      setGroups(result);
    })();
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
                    {canSeeField(user, 'name') && <span style={{ fontWeight: 600, fontSize: '.78rem' }}>{p.name}</span>}
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--tx2)' }}>
                    {p.facility && <>{p.facility} &middot; </>}{p.leukemiaType}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
