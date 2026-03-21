import { useState, useEffect, useCallback } from 'react';
import { ShipmentRepo, StepRepo, PatientRepo } from '../storage/repository.js';

export function useShipments() {
  const [shipments, setShipments] = useState([]);

  const refresh = useCallback(() => {
    setShipments(ShipmentRepo.getAll());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getShippablePatients = useCallback(() => {
    const patients = PatientRepo.getAll();

    return patients.filter((p) => {
      const pbmc = StepRepo.getPbmc(p.id);
      if (!pbmc?.submitted) return false;

      const vialsTotal = parseInt(pbmc?.vials, 10) || 0;
      if (vialsTotal <= 0) return false;

      const transfer = StepRepo.getTransfer(p.id);
      const alreadyShipped = transfer?.totalVialsShipped || 0;

      return vialsTotal - alreadyShipped > 0;
    }).map((p) => {
      const pbmc = StepRepo.getPbmc(p.id);
      const transfer = StepRepo.getTransfer(p.id);
      const vialsTotal = parseInt(pbmc?.vials, 10) || 0;
      const alreadyShipped = transfer?.totalVialsShipped || 0;
      return { ...p, vialsAvailable: vialsTotal - alreadyShipped, vialsTotal };
    });
  }, []);

  const createShipment = useCallback((shipmentData, userId) => {
    const now = new Date().toISOString();
    const shipment = {
      ...shipmentData,
      id: `ship_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      createdBy: userId,
      createdAt: now,
      status: 'shipped',
      receivedBy: null,
      receivedAt: null,
      receiptNotes: '',
    };

    ShipmentRepo.add(shipment);

    // Update each patient's transfer step — APPEND to shipments array
    for (const sample of shipment.samples) {
      const existing = StepRepo.getTransfer(sample.patientId) || {
        shipments: [],
        totalVialsShipped: 0,
        submitted: false,
        submittedAt: null,
        submittedBy: null,
        receiptConfirmed: false,
        receiptConfirmedAt: null,
        receiptConfirmedBy: null,
        sampleCondition: '',
        vialsReceived: null,
        qcCellCount: '',
        qcViability: '',
        qcNotes: '',
      };

      // Ensure shipments array exists (migration compat)
      const existingShipments = Array.isArray(existing.shipments) ? existing.shipments : [];

      StepRepo.saveTransfer(sample.patientId, {
        ...existing,
        shipments: [
          ...existingShipments,
          { shipmentId: shipment.id, vialsShipped: sample.vialsShipped, shipDate: shipment.shipDate },
        ],
        totalVialsShipped: (existing.totalVialsShipped || 0) + sample.vialsShipped,
        submitted: true,
        submittedAt: existing.submittedAt || now,
        submittedBy: existing.submittedBy || userId,
      });
    }

    refresh();
    return shipment;
  }, [refresh]);

  const confirmReception = useCallback((shipmentId, receptionData, userId) => {
    const shipment = ShipmentRepo.getById(shipmentId);
    if (!shipment) return null;

    const now = new Date().toISOString();

    const updatedSamples = shipment.samples.map((s) => {
      const qc = receptionData.samples?.find((r) => r.patientId === s.patientId);
      if (qc) return { ...s, ...qc, received: true };
      return s;
    });

    const allReceived = updatedSamples.every((s) => s.received);
    const someReceived = updatedSamples.some((s) => s.received);

    const updated = {
      ...shipment,
      samples: updatedSamples,
      status: allReceived ? 'received' : someReceived ? 'partial' : shipment.status,
      receivedBy: userId,
      receivedAt: now,
      receiptNotes: receptionData.receiptNotes || '',
    };

    ShipmentRepo.update(updated);

    // Sync QC data back to per-patient transfer steps
    for (const sample of updatedSamples) {
      if (sample.received) {
        const transfer = StepRepo.getTransfer(sample.patientId);
        if (!transfer) continue;

        // Check if ALL shipments for this patient are now received
        const allShipments = ShipmentRepo.getAll();
        const patientShipmentEntries = transfer.shipments || [];
        const allPatientShipmentsReceived = patientShipmentEntries.every((entry) => {
          const s = allShipments.find((sh) => sh.id === entry.shipmentId);
          if (!s) return true; // deleted shipment, treat as done
          const patientSample = s.samples.find((sa) => sa.patientId === sample.patientId);
          return patientSample?.received;
        });

        StepRepo.saveTransfer(sample.patientId, {
          ...transfer,
          receiptConfirmed: allPatientShipmentsReceived,
          receiptConfirmedAt: allPatientShipmentsReceived ? now : transfer.receiptConfirmedAt,
          receiptConfirmedBy: allPatientShipmentsReceived ? userId : transfer.receiptConfirmedBy,
          // Store latest QC data
          sampleCondition: sample.sampleCondition,
          vialsReceived: sample.vialsReceived,
          qcCellCount: sample.qcCellCount,
          qcViability: sample.qcViability,
          qcNotes: sample.qcNotes,
        });
      }
    }

    refresh();
    return updated;
  }, [refresh]);

  const deleteShipment = useCallback((shipmentId) => {
    const shipment = ShipmentRepo.getById(shipmentId);
    if (!shipment) return;

    // Remove shipment entry from each patient's transfer step
    for (const sample of shipment.samples) {
      const transfer = StepRepo.getTransfer(sample.patientId);
      if (!transfer) continue;

      const remainingShipments = (transfer.shipments || []).filter((e) => e.shipmentId !== shipmentId);
      const totalVialsShipped = remainingShipments.reduce((sum, e) => sum + (e.vialsShipped || 0), 0);

      if (remainingShipments.length === 0) {
        // No more shipments — reset completely
        StepRepo.saveTransfer(sample.patientId, {
          shipments: [],
          totalVialsShipped: 0,
          submitted: false,
          submittedAt: null,
          submittedBy: null,
          receiptConfirmed: false,
          receiptConfirmedAt: null,
          receiptConfirmedBy: null,
          sampleCondition: '',
          vialsReceived: null,
          qcCellCount: '',
          qcViability: '',
          qcNotes: '',
        });
      } else {
        StepRepo.saveTransfer(sample.patientId, {
          ...transfer,
          shipments: remainingShipments,
          totalVialsShipped,
        });
      }
    }

    ShipmentRepo.remove(shipmentId);
    refresh();
  }, [refresh]);

  return { shipments, refresh, getShippablePatients, createShipment, confirmReception, deleteShipment };
}
