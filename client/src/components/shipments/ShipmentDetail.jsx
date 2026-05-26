import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { SAMPLE_CONDITIONS } from '../../constants/index.js';
import { canSeeField } from '../../utils/pii.js';

export default function ShipmentDetail({ shipment, onConfirmReception, onBack, onViewPatient }) {
  const { t, user, users } = useApp();
  const ts = t.shipment;
  const role = user?.role;
  const canReceive = (role === 'liege' || role === 'admin') && shipment.status === 'shipped';

  const creator = users.find((u) => u.id === shipment.createdBy)?.name;
  const receiver = shipment.receivedBy ? users.find((u) => u.id === shipment.receivedBy)?.name : null;
  const totalVials = shipment.samples.reduce((s, x) => s + (x.vialsShipped || 0), 0);

  // Reception form state
  const [receptionData, setReceptionData] = useState(() => ({
    receiptNotes: '',
    samples: shipment.samples.map((s) => ({
      patientId: s.patientId,
      received: s.received || false,
      vialsReceived: s.vialsReceived ?? s.vialsShipped,
      sampleCondition: s.sampleCondition || 'intact',
      qcCellCount: s.qcCellCount || '',
      qcViability: s.qcViability || '',
      qcNotes: s.qcNotes || '',
    })),
  }));

  const updateSampleQC = (idx, changes) => {
    setReceptionData((prev) => ({
      ...prev,
      samples: prev.samples.map((s, i) => (i === idx ? { ...s, ...changes } : s)),
    }));
  };

  const anyReceived = receptionData.samples.some((s) => s.received);

  const handleConfirm = () => {
    onConfirmReception(shipment.id, receptionData);
  };

  const statusLabel = shipment.status === 'shipped' ? ts.statusShipped
    : shipment.status === 'received' ? ts.statusReceived
    : ts.statusPartial;

  const conditionLabel = (c) => {
    if (c === 'intact') return ts.conditionIntact;
    if (c === 'compromised') return ts.conditionCompromised;
    if (c === 'damaged') return ts.conditionDamaged;
    if (c === 'missing') return ts.conditionMissing;
    return c;
  };

  return (
    <div className="fade">
      <button className="btn btn-ghost mb12" onClick={onBack}>&larr; {t.pt.back}</button>

      {/* Shipment header */}
      <div className="card">
        <div className="fb mb12">
          <div className="ct" style={{ marginBottom: 0 }}>{ts.hub}</div>
          <span className={`badge ${shipment.status === 'received' ? 'b-ok' : shipment.status === 'partial' ? 'b-warn' : 'b-liege'}`}>
            {statusLabel}
          </span>
        </div>
        <div className="g2 mb12">
          <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts.date}</div>
            <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{shipment.shipDate}</div>
          </div>
          {shipment.trackingNumber && (
            <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts.tracking}</div>
              <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{shipment.trackingNumber}</div>
            </div>
          )}
          <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts.patients}</div>
            <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{shipment.samples.length}</div>
          </div>
          <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts.vials}</div>
            <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{totalVials}</div>
          </div>
        </div>
        {shipment.shipNotes && (
          <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginBottom: 8 }}>
            <strong>{ts.notes}:</strong> {shipment.shipNotes}
          </div>
        )}
        <div style={{ fontSize: '.8rem', color: 'var(--tx3)' }}>
          {creator && <>Created by {creator} &middot; </>}
          {shipment.createdAt?.split('T')[0]}
          {receiver && <> &middot; Received by {receiver} &middot; {shipment.receivedAt?.split('T')[0]}</>}
        </div>
      </div>

      {/* Samples list */}
      <div className="card">
        <div className="ct">{ts.selectPatients.replace('Select s', 'S')}</div>

        {shipment.samples.map((sample, idx) => {
          const qc = receptionData.samples[idx];
          const isReceived = canReceive ? qc.received : sample.received;

          return (
            <div
              key={sample.patientId}
              style={{
                padding: '12px', borderRadius: 8,
                border: `1px solid ${sample.received ? 'var(--ok)' : 'var(--bd)'}`,
                background: sample.received ? 'rgba(16,185,129,0.04)' : 'var(--s1)',
                marginBottom: 10,
              }}
            >
              {/* Patient info row */}
              <div className="fb mb8">
                <div
                  className="fc gap6"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onViewPatient?.({ id: sample.patientId, code: sample.patientCode, name: sample.patientName })}
                >
                  <span className="code-pill">{sample.patientCode}</span>
                  {canSeeField(user, 'name') && sample.patientName && <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{sample.patientName}</span>}
                </div>
                <div className="fc gap6">
                  {sample.facility && <span style={{ fontSize: '.78rem', color: 'var(--tx2)' }}>{sample.facility}</span>}
                  <span className="badge b-ac">{sample.vialsShipped}/{sample.vialsTotal} {ts.vials}</span>
                </div>
              </div>

              {/* Reception form (Liège editing) */}
              {canReceive && (
                <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10, marginTop: 4 }}>
                  <label className="cbox mb8">
                    <input
                      type="checkbox"
                      checked={qc.received}
                      onChange={(e) => updateSampleQC(idx, { received: e.target.checked })}
                    />
                    <span className="cbox-lbl">{ts.sampleReceived}</span>
                  </label>

                  {qc.received && (
                    <div className="g2">
                      <div className="f">
                        <label className="lbl">{ts.vialsReceived}</label>
                        <input
                          type="number"
                          className="inp"
                          value={qc.vialsReceived}
                          min={0}
                          max={sample.vialsShipped}
                          onChange={(e) => updateSampleQC(idx, { vialsReceived: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>
                      <div className="f">
                        <label className="lbl">{ts.condition}</label>
                        <select className="sel" value={qc.sampleCondition} onChange={(e) => updateSampleQC(idx, { sampleCondition: e.target.value })}>
                          {SAMPLE_CONDITIONS.map((c) => (
                            <option key={c} value={c}>{conditionLabel(c)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="f">
                        <label className="lbl">{ts.qcCellCount}</label>
                        <input type="text" className="inp" value={qc.qcCellCount} onChange={(e) => updateSampleQC(idx, { qcCellCount: e.target.value })} />
                      </div>
                      <div className="f">
                        <label className="lbl">{ts.qcViability}</label>
                        <input type="number" className="inp" value={qc.qcViability} onChange={(e) => updateSampleQC(idx, { qcViability: e.target.value })} />
                      </div>
                      <div className="f" style={{ gridColumn: '1 / -1' }}>
                        <label className="lbl">{ts.qcNotes}</label>
                        <textarea className="tea" value={qc.qcNotes} onChange={(e) => updateSampleQC(idx, { qcNotes: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Read-only QC results (after reception) */}
              {!canReceive && sample.received && (
                <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10, marginTop: 4 }}>
                  <div className="badge b-ok mb8">&#10003; {ts.sampleReceived}</div>
                  <div className="g2">
                    {[
                      { l: ts.vialsReceived, v: `${sample.vialsReceived}/${sample.vialsShipped}` },
                      { l: ts.condition, v: conditionLabel(sample.sampleCondition) },
                      { l: ts.qcCellCount, v: sample.qcCellCount },
                      { l: ts.qcViability, v: sample.qcViability ? `${sample.qcViability}%` : '' },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '6px 8px', background: 'var(--s2)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.l}</div>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{item.v || '\u2014'}</div>
                      </div>
                    ))}
                  </div>
                  {sample.qcNotes && (
                    <div className="mt8" style={{ fontSize: '.82rem', color: 'var(--tx2)' }}>
                      <strong>{ts.qcNotes}:</strong> {sample.qcNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Reception confirm button */}
        {canReceive && (
          <>
            <div className="f mt12">
              <label className="lbl">{ts.receiptNotes}</label>
              <textarea
                className="tea"
                value={receptionData.receiptNotes}
                onChange={(e) => setReceptionData((prev) => ({ ...prev, receiptNotes: e.target.value }))}
              />
            </div>
            <div className="fc gap8 mt12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ac" disabled={!anyReceived} onClick={handleConfirm}>
                {ts.confirmReception}
              </button>
            </div>
          </>
        )}

        {/* Show receipt notes if already received */}
        {!canReceive && shipment.receiptNotes && (
          <div className="mt12" style={{ fontSize: '.85rem', color: 'var(--tx2)' }}>
            <strong>{ts.receiptNotes}:</strong> {shipment.receiptNotes}
          </div>
        )}
      </div>
    </div>
  );
}
