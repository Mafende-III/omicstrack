import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { canSeeField } from '../../utils/pii.js';

export default function CreateShipmentForm({ shippablePatients, onSubmit, onCancel }) {
  const { t, user } = useApp();
  const ts = t.shipment;

  const [selected, setSelected] = useState({});
  const [shipDate, setShipDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipNotes, setShipNotes] = useState('');

  const togglePatient = (p) => {
    setSelected((prev) => {
      if (prev[p.id]) {
        const next = { ...prev };
        delete next[p.id];
        return next;
      }
      return { ...prev, [p.id]: { vialsToShip: p.vialsAvailable } };
    });
  };

  const updateVials = (patientId, count) => {
    setSelected((prev) => ({
      ...prev,
      [patientId]: { ...prev[patientId], vialsToShip: count },
    }));
  };

  const selectedIds = Object.keys(selected);
  const totalVials = selectedIds.reduce((sum, id) => sum + (selected[id].vialsToShip || 0), 0);
  const canSubmit = selectedIds.length > 0 && shipDate && totalVials > 0;

  const handleSubmit = () => {
    const samples = selectedIds.map((id) => {
      const p = shippablePatients.find((x) => x.id === id);
      return {
        patientId: id,
        patientCode: p.code,
        patientName: p.name,
        facility: p.facility,
        vialsShipped: selected[id].vialsToShip,
        vialsTotal: p.vialsAvailable,
        received: false,
        vialsReceived: null,
        sampleCondition: '',
        qcCellCount: '',
        qcViability: '',
        qcNotes: '',
      };
    });

    onSubmit({ shipDate, trackingNumber, shipNotes, samples });
  };

  return (
    <div className="card slide-up">
      <div className="ct">{ts.create}</div>

      {/* Shipment details */}
      <div className="g2 mb12">
        <div className="f">
          <label className="lbl">{ts.date}</label>
          <input type="date" className="inp" value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
        </div>
        <div className="f">
          <label className="lbl">{ts.tracking}</label>
          <input type="text" className="inp" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="DHL, FedEx..." />
        </div>
      </div>
      <div className="f mb12">
        <label className="lbl">{ts.notes}</label>
        <textarea className="tea" value={shipNotes} onChange={(e) => setShipNotes(e.target.value)} placeholder="Dry ice, temperature conditions..." />
      </div>

      {/* Patient selector */}
      <div className="ct" style={{ marginBottom: 8 }}>{ts.selectPatients}</div>
      {shippablePatients.length === 0 ? (
        <div className="al al-info">{ts.noEligible}</div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
          {shippablePatients.map((p) => {
            const isSelected = !!selected[p.id];
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  border: `2px solid ${isSelected ? 'var(--ac)' : 'var(--bd)'}`,
                  background: isSelected ? 'var(--acd)' : 'var(--s1)',
                  marginBottom: 8, transition: 'all .15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePatient(p)}
                  style={{ accentColor: 'var(--ac)', width: 18, height: 18 }}
                />
                <div style={{ flex: 1 }}>
                  <div className="fc gap6 mb4">
                    <span className="code-pill">{p.code}</span>
                    {canSeeField(user?.canSeePii, 'name') && p.name && <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{p.name}</span>}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--tx2)' }}>
                    {p.facility && <>{p.facility} &middot; </>}{p.vialsAvailable} {ts.vialsAvailable}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: '.75rem', color: 'var(--tx2)', whiteSpace: 'nowrap' }}>{ts.vialsToShip}:</label>
                    <input
                      type="number"
                      className="inp"
                      style={{ width: 64, textAlign: 'center', padding: '6px 8px' }}
                      value={selected[p.id].vialsToShip}
                      min={1}
                      max={p.vialsAvailable}
                      onChange={(e) => updateVials(p.id, Math.min(parseInt(e.target.value, 10) || 0, p.vialsAvailable))}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {selectedIds.length > 0 && (
        <div className="card-inner mb12">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem', marginBottom: 8 }}>
            {ts.summary}
          </div>
          <div className="fc gap12">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--ac)' }}>{selectedIds.length}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase' }}>{ts.patients}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--ac)' }}>{totalVials}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--tx3)', textTransform: 'uppercase' }}>{ts.vials}</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="fc gap8" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-bd" onClick={onCancel}>{ts.cancel}</button>
        <button className="btn btn-ac" disabled={!canSubmit} onClick={handleSubmit}>{ts.submit}</button>
      </div>
    </div>
  );
}
