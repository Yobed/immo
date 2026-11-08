import fs from 'fs';
import path from 'path';
import { Property, ConciergeInspection, ConciergeCheckStatus, PropertyStatus } from './types';
import { INITIAL_PROPERTIES } from './mock-data';

// Fichier de persistance sur disque pour survivre aux redémarrages de dev
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'concierge-store.json');

interface StoreState {
  properties: Property[];
  inspections: ConciergeInspection[];
  lastUpdated: string;
}

// Initialisation des données par défaut avec historique initial crédible
const INITIAL_INSPECTIONS: ConciergeInspection[] = [
  {
    id: 'insp-001',
    property_id: 'prop-001',
    property_title: 'Villa Duplex Contemporaine Meublée avec Piscine & Vue Lagune',
    property_reference: 'VIL-RG-2026',
    inspector_name: 'Jean-Eudes Kouassi',
    inspector_phone: '+2250788421920',
    inspector_role: 'Concierge en Chef VIP',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Il y a 45 min
    check_status: 'ready',
    availability_status: 'available',
    cleaning_grade: 'impeccable',
    checklist: {
      cleaning: true,
      linen: true,
      ac_electricity: true,
      plumbing: true,
      keys_security: true,
      welcome_kit: true,
    },
    notes: 'Villa prête pour la visite diplomatique de 15h30. Piscine filtrée, climatiseurs testés à 22°C, groupe 40 kVA opérationnel.',
    issues: [],
    photos: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'insp-002',
    property_id: 'prop-002',
    property_title: 'Penthouse de Prestige Meublé avec Terrasse Panoramique & Jacuzzi',
    property_reference: 'PNT-Z4-104',
    inspector_name: 'Aïcha Traoré',
    inspector_phone: '+2250505123456',
    inspector_role: 'Gouvernante Générale',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // Il y a 3h
    check_status: 'ready',
    availability_status: 'available',
    cleaning_grade: 'impeccable',
    checklist: {
      cleaning: true,
      linen: true,
      ac_electricity: true,
      plumbing: true,
      keys_security: true,
      welcome_kit: true,
    },
    notes: 'Linge de lit brodé installé, terrasse et jacuzzi désinfectés. Ascenseur privatif vérifié.',
    issues: [],
  },
  {
    id: 'insp-003',
    property_id: 'prop-003',
    property_title: 'Appartement Meublé Standing 4 Pièces avec Conciergerie',
    property_reference: 'APP-PL-04',
    inspector_name: 'Moussa Diarra',
    inspector_phone: '+2250707987654',
    inspector_role: 'Superviseur Technique',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // Il y a 6h
    check_status: 'ready',
    availability_status: 'available',
    cleaning_grade: 'satisfaisant',
    checklist: {
      cleaning: true,
      linen: true,
      ac_electricity: true,
      plumbing: true,
      keys_security: true,
      welcome_kit: true,
    },
    notes: 'Contrôle fibre optique et domotique validé. Clés remises au coffre de l\'agence.',
  }
];

// Enrichir les propriétés initiales avec le statut de conciergerie
function getSeedProperties(): Property[] {
  return INITIAL_PROPERTIES.map((p) => {
    const inspection = INITIAL_INSPECTIONS.find((i) => i.property_id === p.id);
    if (inspection) {
      return {
        ...p,
        status: inspection.availability_status,
        concierge_status: inspection.check_status,
        last_inspection_date: inspection.timestamp,
        last_inspector_name: inspection.inspector_name,
        inspection_notes: inspection.notes,
        cleaning_grade: inspection.cleaning_grade,
        checklist: inspection.checklist,
      };
    }
    return {
      ...p,
      concierge_status: 'ready' as ConciergeCheckStatus,
      last_inspection_date: new Date().toISOString(),
      last_inspector_name: 'Conciergerie Centrale',
    };
  });
}

// Singleton mémoire
let globalStore: StoreState | null = null;

function loadStore(): StoreState {
  if (globalStore) return globalStore;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      globalStore = JSON.parse(data);
      return globalStore!;
    }
  } catch (err) {
    console.error('Erreur lecture store conciergerie:', err);
  }

  // Initialisation par défaut
  globalStore = {
    properties: getSeedProperties(),
    inspections: INITIAL_INSPECTIONS,
    lastUpdated: new Date().toISOString(),
  };

  saveStore(globalStore);
  return globalStore;
}

function saveStore(store: StoreState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur sauvegarde store conciergerie:', err);
  }
}

/**
 * Récupérer la liste des biens à jour avec leur statut de conciergerie
 */
export function getLiveProperties(): Property[] {
  const store = loadStore();
  return store.properties;
}

/**
 * Récupérer un bien spécifique
 */
export function getLivePropertyById(id: string): Property | undefined {
  const store = loadStore();
  return store.properties.find((p) => p.id === id);
}

/**
 * Récupérer l'historique complet des inspections
 */
export function getLiveInspections(): ConciergeInspection[] {
  const store = loadStore();
  return store.inspections;
}

/**
 * Enregistrer une nouvelle inspection et propager immédiatement le statut
 */
export function recordConciergeInspection(data: Omit<ConciergeInspection, 'id' | 'timestamp'>): {
  success: boolean;
  property: Property;
  inspection: ConciergeInspection;
} {
  const store = loadStore();

  const inspectionId = `insp-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const newInspection: ConciergeInspection = {
    ...data,
    id: inspectionId,
    timestamp,
  };

  // Mettre à jour la propriété ciblée
  const propIndex = store.properties.findIndex((p) => p.id === data.property_id);
  
  let targetProp: Property;

  if (propIndex >= 0) {
    targetProp = {
      ...store.properties[propIndex],
      status: data.availability_status,
      concierge_status: data.check_status,
      last_inspection_date: timestamp,
      last_inspection_started_at: data.started_at,
      last_inspection_duration: data.duration_minutes,
      last_inspection_photos: data.photos,
      last_inspector_name: data.inspector_name,
      inspection_notes: data.notes,
      cleaning_grade: data.cleaning_grade,
      checklist: data.checklist,
      updated_at: timestamp,
    };
    store.properties[propIndex] = targetProp;
  } else {
    // Cas de secours si id non trouvé
    targetProp = store.properties[0];
  }

  // Ajouter l'inspection en tête de liste
  store.inspections = [newInspection, ...store.inspections];
  store.lastUpdated = timestamp;

  saveStore(store);

  return {
    success: true,
    property: targetProp,
    inspection: newInspection,
  };
}
