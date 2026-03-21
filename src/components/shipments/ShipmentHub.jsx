import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useShipments } from '../../hooks/useShipments.js';
import ShipmentPipeline from '../dashboard/ShipmentPipeline.jsx';
import ShipmentCard from './ShipmentCard.jsx';
import ShipmentDetail from './ShipmentDetail.jsx';
import CreateShipmentForm from './CreateShipmentForm.jsx';

export default function ShipmentHub({ onViewPatient }) {
  const { t, user, logAudit } = useApp();
  const ts = t.shipment;
  const role = user?.role;
  const canCreate = role === 'admin' || role === 'entry';

  const { shipments, getShippablePatients, createShipment, confirmReception, refresh } = useShipments();

  const [creating, setCreating] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const handleCreate = (data) => {
    const shipment = createShipment(data, user?.id);
    logAudit('shipment.create', 'shipment', shipment.id, `Shipment created: ${data.samples.length} patients, ${data.samples.reduce((s, x) => s + x.vialsShipped, 0)} vials`);
    setCreating(false);
  };

  const handleReception = (shipmentId, receptionData) => {
    confirmReception(shipmentId, receptionData, user?.id);
    logAudit('shipment.receive', 'shipment', shipmentId, `Shipment received: ${receptionData.samples.filter((s) => s.received).length} samples confirmed`);
    setSelectedShipment(null);
  };

  // If viewing a specific shipment
  if (selectedShipment) {
    // Re-fetch to get latest data
    const fresh = shipments.find((s) => s.id === selectedShipment.id) || selectedShipment;
    return (
      <ShipmentDetail
        shipment={fresh}
        onConfirmReception={handleReception}
        onBack={() => { setSelectedShipment(null); refresh(); }}
        onViewPatient={onViewPatient}
      />
    );
  }

  const shipped = shipments.filter((s) => s.status === 'shipped');
  const completed = shipments.filter((s) => s.status === 'received' || s.status === 'partial');

  return (
    <div className="fade">
      <div className="fb mb16">
        <div>
          <div className="ph">{ts.hub}</div>
          <div className="ps">{shipments.length} {ts.hub.toLowerCase()}</div>
        </div>
        {canCreate && !creating && (
          <button className="btn btn-ac" onClick={() => setCreating(true)}>
            + {ts.create}
          </button>
        )}
      </div>

      {creating && (
        <CreateShipmentForm
          shippablePatients={getShippablePatients()}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* Pipeline overview */}
      <ShipmentPipeline onViewPatient={onViewPatient} />

      {/* In-transit shipments */}
      {shipped.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="ct">{ts.statusShipped}</div>
          {shipped.map((s) => (
            <ShipmentCard key={s.id} shipment={s} onClick={() => setSelectedShipment(s)} />
          ))}
        </div>
      )}

      {/* Completed shipments */}
      {completed.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="ct">{ts.statusReceived}</div>
          {completed.map((s) => (
            <ShipmentCard key={s.id} shipment={s} onClick={() => setSelectedShipment(s)} />
          ))}
        </div>
      )}

      {shipments.length === 0 && !creating && (
        <div style={{ textAlign: 'center', color: 'var(--tx2)', padding: '40px 0', fontSize: '.88rem' }}>
          {ts.noEligible}
        </div>
      )}
    </div>
  );
}
