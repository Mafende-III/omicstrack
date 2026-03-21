import { useState, useEffect, useCallback } from 'react';
import { api } from '../storage/engine.js';

export function useShipments() {
  const [shipments, setShipments] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/shipments');
      setShipments(data);
    } catch {
      setShipments([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getShippablePatients = useCallback(async () => {
    try {
      return await api.get('/shipments/shippable-patients');
    } catch {
      return [];
    }
  }, []);

  const createShipment = useCallback(async (shipmentData, userId) => {
    const result = await api.post('/shipments', shipmentData);
    await refresh();
    return result;
  }, [refresh]);

  const confirmReception = useCallback(async (shipmentId, receptionData, userId) => {
    const result = await api.post(`/shipments/${shipmentId}/receive`, receptionData);
    await refresh();
    return result;
  }, [refresh]);

  const deleteShipment = useCallback(async (shipmentId) => {
    await api.del(`/shipments/${shipmentId}`);
    await refresh();
  }, [refresh]);

  return { shipments, refresh, getShippablePatients, createShipment, confirmReception, deleteShipment };
}
