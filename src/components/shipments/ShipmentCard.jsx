import { useApp } from '../../context/AppContext.jsx';

const STATUS_BADGE = {
  shipped: 'b-liege',
  received: 'b-ok',
  partial: 'b-warn',
};

export default function ShipmentCard({ shipment, onClick }) {
  const { t, users } = useApp();
  const ts = t.shipment;
  const totalVials = shipment.samples.reduce((s, x) => s + (x.vialsShipped || 0), 0);
  const creator = users.find((u) => u.id === shipment.createdBy)?.name;

  const statusLabel = shipment.status === 'shipped' ? ts.statusShipped
    : shipment.status === 'received' ? ts.statusReceived
    : ts.statusPartial;

  return (
    <div className="ptrow" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div>
        <div className="fc gap6 mb6">
          <span className="code-pill">{shipment.id.split('_').slice(1).join('_').slice(0, 8)}</span>
          <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{shipment.shipDate}</span>
        </div>
        <div className="pt-meta">
          {shipment.samples.length} {ts.patients} &middot; {totalVials} {ts.vials}
          {creator && <> &middot; {creator}</>}
          {shipment.trackingNumber && <> &middot; #{shipment.trackingNumber}</>}
        </div>
      </div>
      <div className="fc gap8">
        <span className={`badge ${STATUS_BADGE[shipment.status] || 'b-muted'}`}>
          {statusLabel}
        </span>
        <span style={{ color: 'var(--tx3)' }}>&rsaquo;</span>
      </div>
    </div>
  );
}
