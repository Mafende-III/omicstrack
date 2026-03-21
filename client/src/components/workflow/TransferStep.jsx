import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import { api } from '../../storage/engine.js';

const DEFAULTS = {
  shipments: [],
  totalVialsShipped: 0,
  submitted: false, submittedAt: null, submittedBy: null,
  receiptConfirmed: false, receiptConfirmedAt: null, receiptConfirmedBy: null,
  sampleCondition: '', vialsReceived: null, qcCellCount: '', qcViability: '', qcNotes: '',
};

export default function TransferStep({ patientId }) {
  const { t, users } = useApp();
  const ts = t.shipment;
  const { data, loading } = useStepData(patientId, 'transfer', DEFAULTS);
  const [pbmcVials, setPbmcVials] = useState(0);

  // Fetch PBMC vials count
  useEffect(() => {
    (async () => {
      try {
        const pbmc = await api.get(`/steps/${patientId}/pbmc`);
        if (pbmc) setPbmcVials(parseInt(pbmc.vials, 10) || 0);
      } catch {
        // ignore
      }
    })();
  }, [patientId]);

  const vialsTotal = pbmcVials;

  // The transfer data from API already includes shipments array
  const shipmentEntries = Array.isArray(data.shipments) ? data.shipments : [];
  const totalShipped = data.totalVialsShipped || shipmentEntries.reduce((s, e) => s + (e.vialsShipped || 0), 0);
  const vialsRemaining = vialsTotal - totalShipped;

  const submitter = data.submittedBy ? users.find((u) => u.id === data.submittedBy)?.name : null;
  const confirmer = data.receiptConfirmedBy ? users.find((u) => u.id === data.receiptConfirmedBy)?.name : null;

  const conditionLabel = (c) => {
    if (c === 'intact') return ts?.conditionIntact || 'Intact';
    if (c === 'compromised') return ts?.conditionCompromised || 'Compromised';
    if (c === 'damaged') return ts?.conditionDamaged || 'Damaged';
    if (c === 'missing') return ts?.conditionMissing || 'Missing';
    return c;
  };

  const statusBadge = (status) => {
    if (status === 'received') return <span className="badge b-ok" style={{ fontSize: '.62rem' }}>&#10003; {ts?.received || 'Received'}</span>;
    if (status === 'partial') return <span className="badge b-warn" style={{ fontSize: '.62rem' }}>{ts?.partial || 'Partial'}</span>;
    return <span className="badge b-ac" style={{ fontSize: '.62rem' }}>{ts?.inTransit || 'In Transit'}</span>;
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--tx3)' }}>Loading...</div>;
  }

  // Not yet in any shipment
  if (!data.submitted || shipmentEntries.length === 0) {
    return (
      <div className="fade">
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#9992;</div>
          <div className="ct">{t.transfer.title}</div>
          <div className="al al-info" style={{ marginBottom: 16 }}>
            {ts?.notAssigned || 'Not yet assigned to a shipment'}
          </div>
          {vialsTotal > 0 && (
            <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginBottom: 12 }}>
              {vialsTotal} {ts?.vials || 'vials'} {ts?.vialsAvailable || 'available'} (PBMC)
            </div>
          )}
          <div style={{ fontSize: '.82rem', color: 'var(--tx3)' }}>
            {ts?.goToShipments || 'Go to the Shipments tab to create or join a shipment'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade">
      {/* Overview card */}
      <div className="card">
        <div className="ct">{t.transfer.title}</div>
        <div className="badge b-ok mb12">&#10003; {t.transfer.done}</div>
        {submitter && (
          <div style={{ fontSize: '.85rem', color: 'var(--tx2)', marginBottom: 12 }}>
            {data.submittedAt?.split('T')[0]} &middot; {submitter}
          </div>
        )}
        <div className="g2 mb12">
          <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts?.vialsShipped || 'Vials Shipped'}</div>
            <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{totalShipped} / {vialsTotal}</div>
          </div>
          <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts?.vialsAvailable || 'Remaining'}</div>
            <div style={{ fontSize: '.9rem', fontWeight: 600, color: vialsRemaining > 0 ? 'var(--ac)' : 'var(--tx3)' }}>{vialsRemaining}</div>
          </div>
          <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '.73rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>{ts?.shipments || 'Shipments'}</div>
            <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{shipmentEntries.length}</div>
          </div>
        </div>
        {vialsRemaining > 0 && (
          <div className="al al-info" style={{ fontSize: '.82rem' }}>
            {vialsRemaining} {ts?.vials || 'vials'} {ts?.vialsAvailable || 'still available'} &mdash; {ts?.goToShipments || 'Go to Shipments tab to ship more'}
          </div>
        )}
      </div>

      {/* Individual shipment cards */}
      {shipmentEntries.map((entry, idx) => (
        <div key={entry.shipmentId || idx} className="card" style={{ borderLeft: `3px solid ${entry.shipmentStatus === 'received' ? 'var(--ok)' : 'var(--ac)'}` }}>
          <div className="fc gap8 mb8" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem' }}>
              {ts?.shipmentLabel || 'Shipment'} #{idx + 1}
            </div>
            {statusBadge(entry.shipmentStatus || 'shipped')}
          </div>

          <div className="g2 mb8">
            {entry.shipDate && (
              <div style={{ padding: '6px 8px', background: 'var(--s2)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '.68rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 1 }}>{ts?.date || 'Ship Date'}</div>
                <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{entry.shipDate}</div>
              </div>
            )}
            <div style={{ padding: '6px 8px', background: 'var(--s2)', borderRadius: 6, border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: '.68rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 1 }}>{ts?.vialsShipped || 'Vials'}</div>
              <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{entry.vialsShipped}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Overall reception status */}
      <div className="card" style={{ borderLeft: '3px solid var(--liege-c)' }}>
        <div className="ct" style={{ color: 'var(--liege-c)' }}>{t.transfer.receipt}</div>
        {data.receiptConfirmed ? (
          <div>
            <div className="al al-ok">&#10003; {t.transfer.receiptDone}</div>
            {confirmer && (
              <div className="mt8" style={{ fontSize: '.82rem', color: 'var(--tx2)' }}>
                {data.receiptConfirmedAt?.split('T')[0]} &middot; {confirmer}
              </div>
            )}

            {/* Origin vs Liege QC comparison */}
            {pbmcVials > 0 && (data.qcCellCount || data.qcViability) && (
              <div className="card-inner mt12">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.82rem', marginBottom: 10, color: 'var(--ac)' }}>
                  Origin vs Li&egrave;ge QC
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '.82rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--tx3)' }}></div>
                  <div style={{ fontWeight: 600, color: 'var(--tx2)', textAlign: 'center' }}>Origin</div>
                  <div style={{ fontWeight: 600, color: 'var(--liege-c)', textAlign: 'center' }}>Li&egrave;ge</div>
                  <div style={{ color: 'var(--tx2)' }}>Cell Count</div>
                  <div style={{ textAlign: 'center' }}>&mdash;</div>
                  <div style={{ textAlign: 'center', color: 'var(--liege-c)' }}>{data.qcCellCount || '\u2014'}</div>
                  <div style={{ color: 'var(--tx2)' }}>Viability</div>
                  <div style={{ textAlign: 'center' }}>&mdash;</div>
                  <div style={{ textAlign: 'center', color: 'var(--liege-c)' }}>{data.qcViability ? `${data.qcViability}%` : '\u2014'}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="al al-info">
            {ts?.awaitingReception || 'Awaiting reception at Li\u00e8ge'} &mdash; {t.status.pending}
          </div>
        )}
      </div>
    </div>
  );
}
