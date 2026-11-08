'use client';

import { useState, useEffect, useCallback } from 'react';
import { Property, ConciergeInspection, ConciergeCheckStatus, PropertyStatus } from './types';
import { INITIAL_PROPERTIES } from './mock-data';

const SYNC_CHANNEL_NAME = 'ag_concierge_sync_channel';
const LOCAL_STORAGE_KEY = 'ag_live_properties_cache';

export function useLiveProperties() {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [inspections, setInspections] = useState<ConciergeInspection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Fonction de récupération depuis l'API
  const fetchLiveProperties = useCallback(async () => {
    try {
      const res = await fetch('/api/properties', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.properties)) {
        setProperties(data.properties);
        setLastSyncTime(data.timestamp || new Date().toISOString());
        // Sauvegarder dans localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.properties));
        } catch (e) {}
      }
    } catch (err) {
      // Échec silencieux, conserve les données courantes
    }
  }, []);

  const fetchLiveInspections = useCallback(async () => {
    try {
      const res = await fetch('/api/concierge/inspections', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.inspections)) {
        setInspections(data.inspections);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    // 1. Lire depuis le cache local s'il existe
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProperties(parsed);
        }
      }
    } catch (e) {}

    // 2. Fetch initial
    fetchLiveProperties();
    fetchLiveInspections();

    // 3. Écouteur BroadcastChannel pour synchronisation immédiate inter-onglets (0ms)
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'CONCIERGE_INSPECTION_UPDATE') {
          if (event.data.property) {
            setProperties((prev) =>
              prev.map((p) => (p.id === event.data.property.id ? event.data.property : p))
            );
          }
          if (event.data.inspection) {
            setInspections((prev) => [event.data.inspection, ...prev]);
          }
          setLastSyncTime(new Date().toISOString());
        } else if (event.data?.type === 'REFRESH_ALL') {
          fetchLiveProperties();
          fetchLiveInspections();
        }
      };
    }

    // 4. Polling toutes les 5 secondes pour attraper les mises à jour faites depuis d'autres téléphones
    const interval = setInterval(() => {
      fetchLiveProperties();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (channel) {
        channel.close();
      }
    };
  }, [fetchLiveProperties, fetchLiveInspections]);

  // Fonction pour soumettre une inspection depuis l'app Concierge
  const submitInspection = async (
    inspectionData: Omit<ConciergeInspection, 'id' | 'timestamp'>
  ): Promise<{ success: boolean; property?: Property; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/concierge/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      const updatedProp = data.property as Property;
      const newInspection = data.inspection as ConciergeInspection;

      // Mise à jour de l'état local immédiate
      setProperties((prev) =>
        prev.map((p) => (p.id === updatedProp.id ? updatedProp : p))
      );
      setInspections((prev) => [newInspection, ...prev]);
      setLastSyncTime(new Date().toISOString());

      // Sauvegarde dans localStorage
      try {
        const cached = properties.map((p) => (p.id === updatedProp.id ? updatedProp : p));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cached));
      } catch (e) {}

      // Diffusion BroadcastChannel à tous les autres onglets ouverts (CRM, Flipbook, Site)
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({
          type: 'CONCIERGE_INSPECTION_UPDATE',
          property: updatedProp,
          inspection: newInspection,
        });
        channel.close();
      }

      setIsLoading(false);
      return { success: true, property: updatedProp };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Erreur réseau' };
    }
  };

  return {
    properties,
    inspections,
    isLoading,
    lastSyncTime,
    submitInspection,
    refresh: fetchLiveProperties,
  };
}
