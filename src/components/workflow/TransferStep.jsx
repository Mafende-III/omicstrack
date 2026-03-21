import { useApp } from '../../context/AppContext.jsx';
import { useStepData } from '../../hooks/useStepData.js';
import { ShipmentRepo, StepRepo } from '../../storage/repository.js';

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
  const { data } = useStepData(patientId, 'transfer', DEFAULTS);

  const pbmc = StepRepo.getPbmc(patientId);
  const vialsTotal = parseInt(pbmc?.vials, 10) || 0;

  // Normalize: support both old single-shipmentId and new shipments[] format
  const shipmentEntries = Array.isArray(data.shipments) && data.shipments.length > 0
    ? data.shipments
    : data.shipmentId
      ? [{ shipmentId: data.shipmentId, vialsShipped: data.vialsShipped || 0 }]
      : [];

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

  // Resolve each shipment entry to full shipment data
  const allShipments = ShipmentRepo.getAll();
  const resolvedShipments = shipmentEntries.map((entry) => {
    const shipment = allShipments.find((s) => s.id === entry.shipmentId);
    const patientSample = shipment?.samples?.find((s) => s.patientId === patientId);
    return {
      ...entry,
      shipment,
      patientSample,
      status: shipment?.status || 'shipped',
      received: patientSample?.received || false,
    };
  });

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
      {resolvedShipments.map((entry, idx) => (
        <div key={entry.shipmentId || idx} className="card" style={{ borderLeft: `3px solid ${entry.received ? 'var(--ok)' : 'var(--ac)'}` }}>
          <div className="fc gap8 mb8" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.88rem' }}>
              {ts?.shipmentLabel || 'Shipment'} #{idx + 1}
            </div>
            {statusBadge(entry.received ? 'received' : entry.status)}
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
            {entry.shipment?.trackingNumber && (
              <div style={{ padding: '6px 8px', background: 'var(--s2)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '.68rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 1 }}>{ts?.tracking || 'Tracking'}</div>
                <div style={{ fontSize: '.82rem', fontWeight: 600 }}>#{entry.shipment.trackingNumber}</div>
              </div>
            )}
            {entry.shipment && (
              <div style={{ padding: '6px 8px', background: 'var(--s2)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '.68rem', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 1 }}>{ts?.patients || 'Batch'}</div>
                <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{entry.shipment.samples.length} {ts?.patients || 'patients'}</div>
              </div>
            )}
          </div>

          {/* Per-shipment QC if received */}
          {entry.received && entry.patientSample && (
            <div style={{ padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.78rem', marginBottom: 6, color: 'var(--liege-c)' }}>
                {ts?.receptionQC || 'Reception QC'}
              </div>
              <div className="g2">
                {entry.patientSample.sampleCondition && (
                  <div>
                    <div style={{ fontSize: '.65rem', color: 'var(--tx3)', textTransform: 'uppercase' }}>{ts?.condition || 'Condition'}</div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{conditionLabel(entry.patientSample.sampleCondition)}</div>
                  </div>
                )}
                {entry.patientSample.vialsReceived != null && (
                  <div>
                    <div style={{ fontSize: '.65rem', color: 'var(--tx3)', textTransform: 'uppercase' }}>{ts?.vialsReceived || 'Vials Received'}</div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{entry.patientSample.vialsReceived} / {entry.vialsShipped}</div>
                  </div>
                )}
                {entry.patientSample.qcCellCount && (
                  <div>
                    <div style={{ fontSize: '.65rem', color: 'var(--tx3)', textTransform: 'uppercase' }}>{ts?.qcCellCount || 'Cell Count'}</div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{entry.patientSample.qcCellCount}</div>
                  </div>
                )}
                {entry.patientSample.qcViability && (
                  <div>
                    <div style={{ fontSize: '.65rem', color: 'var(--tx3)', textTransform: 'uppercase' }}>{ts?.qcViability || 'Viability'}</div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{entry.patientSample.qcViability}%</div>
                  </div>
                )}
              </div>
              {entry.patientSample.qcNotes && (
                <div style={{ fontSize: '.78rem', color: 'var(--tx2)', marginTop: 6 }}>
                  <strong>{ts?.qcNotes || 'Notes'}:</strong> {entry.patientSample.qcNotes}
                </div>
              )}
            </div>
          )}
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

            {/* Origin vs Liège QC comparison */}
            {pbmc?.submitted && (data.qcCellCount || data.qcViability) && (
              <div className="card-inner mt12">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.82rem', marginBottom: 10, color: 'var(--ac)' }}>
                  Origin vs Li&egrave;ge QC
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '.82rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--tx3)' }}></div>
                  <div style={{ fontWeight: 600, color: 'var(--tx2)', textAlign: 'center' }}>Origin</div>
                  <div style={{ fontWeight: 600, color: 'var(--liege-c)', textAlign: 'center' }}>Li&egrave;ge</div>
                  {pbmc.cellCount && (
                    <>
                      <div style={{ color: 'var(--tx2)' }}>Cell Count</div>
                      <div style={{ textAlign: 'center' }}>{pbmc.cellCount}</div>
                      <div style={{ textAlign: 'center', color: 'var(--liege-c)' }}>{data.qcCellCount || '\u2014'}</div>
                    </>
                  )}
                  {pbmc.viability && (
                    <>
                      <div style={{ color: 'var(--tx2)' }}>Viability</div>
                      <div style={{ textAlign: 'center' }}>{pbmc.viability}%</div>
                      <div style={{ textAlign: 'center', color: 'var(--liege-c)' }}>{data.qcViability ? `${data.qcViability}%` : '\u2014'}</div>
                    </>
                  )}
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
