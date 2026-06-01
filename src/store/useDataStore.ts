import { create } from 'zustand';
import { db, LocalSnapshot } from '../db/PorteriaDB';
import { RegistroMovimiento, AuthorizedPerson, TipoAccion, TipoIngreso } from '../types';
import { SAMPLE_REGISTROS } from '../utils';

export const DEFAULT_AUTHORIZED_PEOPLE: AuthorizedPerson[] = [
  { rut: "12.345.678-9", nombre: "Juan Pérez Silva", tipoIngreso: "Visita", patente: "Peatón" },
  { rut: "18.456.789-2", nombre: "Felipe Sandoval Torres", tipoIngreso: "Residente", patente: "GC-YY-33" },
  { rut: "11.222.333-4", nombre: "Carlos Ruiz (Distribuidora Alimentos)", tipoIngreso: "Proveedor", patente: "DF-GR-88" },
  { rut: "15.678.901-K", nombre: "María José Castro (Electricidad)", tipoIngreso: "Contratista", patente: "HR-WT-24" }
];

interface DataState {
  registros: RegistroMovimiento[];
  authorizedPeople: AuthorizedPerson[];
  snapshots: LocalSnapshot[];
  isLoading: boolean;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  addRegistro: (registro: Omit<RegistroMovimiento, 'id' | 'timestamp' | 'rawDate'>) => Promise<void>;
  deleteRegistro: (id: string) => Promise<void>;
  updateRegistro: (id: string, updates: Partial<RegistroMovimiento>) => Promise<void>;
  addAuthorizedPerson: (person: AuthorizedPerson) => Promise<void>;
  deleteAuthorizedPerson: (rut: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  clearAuthorizedPeople: () => Promise<void>;
  restoreDemoData: () => Promise<void>;
  restoreDefaultAuthorized: () => Promise<void>;
  
  // Backups and Snapshots
  createBackupSnapshot: () => Promise<void>;
  deleteSnapshot: (id: number) => Promise<void>;
  restoreSnapshot: (id: number) => Promise<void>;
  
  // Imports
  importLogs: (logs: RegistroMovimiento[]) => Promise<void>;
  importAuthorizedPeople: (people: AuthorizedPerson[]) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  registros: [],
  authorizedPeople: [],
  snapshots: [],
  isLoading: true,

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch from IndexedDB
      let dbLogs = await db.registros.reverse().toArray(); // newest first
      let dbAuth = await db.authorizedPeople.toArray();
      let dbSnapshots = await db.snapshots.reverse().toArray();

      // 2. Hydrate defaults if empty (first run)
      if (dbLogs.length === 0) {
        await db.registros.bulkAdd(SAMPLE_REGISTROS);
        dbLogs = [...SAMPLE_REGISTROS].reverse();
      }
      if (dbAuth.length === 0) {
        await db.authorizedPeople.bulkAdd(DEFAULT_AUTHORIZED_PEOPLE);
        dbAuth = [...DEFAULT_AUTHORIZED_PEOPLE];
      }

      set({
        registros: dbLogs,
        authorizedPeople: dbAuth,
        snapshots: dbSnapshots,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to fetch initial IndexedDB data:", error);
      set({ isLoading: false });
    }
  },

  addRegistro: async (registroData) => {
    const ahora = new Date();
    
    // Format timestamp as DD/MM/YYYY HH:MM:SS
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minuto = String(ahora.getMinutes()).padStart(2, '0');
    const segundo = String(ahora.getSeconds()).padStart(2, '0');
    const formattedTimestamp = `${dia}/${mes}/${anio} ${hora}:${minuto}:${segundo}`;

    const nuevoRegistro: RegistroMovimiento = {
      ...registroData,
      id: `reg-${Date.now()}`,
      timestamp: formattedTimestamp,
      rawDate: ahora.toISOString()
    };

    await db.registros.add(nuevoRegistro);
    
    set((state) => ({
      registros: [nuevoRegistro, ...state.registros]
    }));

    // Auto create local snapshot for security on every 10 logs
    if (get().registros.length % 10 === 0) {
      await get().createBackupSnapshot();
    }
  },

  deleteRegistro: async (id) => {
    await db.registros.delete(id);
    set((state) => ({
      registros: state.registros.filter(r => r.id !== id)
    }));
  },

  updateRegistro: async (id, updates) => {
    await db.registros.update(id, updates);
    set((state) => ({
      registros: state.registros.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  },

  addAuthorizedPerson: async (person) => {
    await db.authorizedPeople.put(person); // put inserts or overwrites if key (rut) exists
    set((state) => {
      const filtered = state.authorizedPeople.filter(p => p.rut !== person.rut);
      return {
        authorizedPeople: [...filtered, person]
      };
    });
  },

  deleteAuthorizedPerson: async (rut) => {
    await db.authorizedPeople.delete(rut);
    set((state) => ({
      authorizedPeople: state.authorizedPeople.filter(p => p.rut !== rut)
    }));
  },

  clearLogs: async () => {
    await db.registros.clear();
    set({ registros: [] });
  },

  clearAuthorizedPeople: async () => {
    await db.authorizedPeople.clear();
    set({ authorizedPeople: [] });
  },

  restoreDemoData: async () => {
    await db.registros.clear();
    await db.registros.bulkAdd(SAMPLE_REGISTROS);
    const dbLogs = await db.registros.reverse().toArray();
    set({ registros: dbLogs });
  },

  restoreDefaultAuthorized: async () => {
    await db.authorizedPeople.clear();
    await db.authorizedPeople.bulkAdd(DEFAULT_AUTHORIZED_PEOPLE);
    const dbAuth = await db.authorizedPeople.toArray();
    set({ authorizedPeople: dbAuth });
  },

  createBackupSnapshot: async () => {
    const ahora = new Date();
    const formatted = ahora.toLocaleString('es-CL');
    
    const snapshot: LocalSnapshot = {
      timestamp: formatted,
      registros: get().registros,
      authorizedPeople: get().authorizedPeople
    };

    const id = await db.snapshots.add(snapshot);
    const updatedSnap = await db.snapshots.reverse().toArray();
    
    set({ snapshots: updatedSnap });
    
    // Maintain maximum of 5 snapshots to avoid IndexedDB bloat
    if (updatedSnap.length > 5) {
      const oldest = updatedSnap[updatedSnap.length - 1];
      if (oldest.id) {
        await db.snapshots.delete(oldest.id);
        set((state) => ({
          snapshots: state.snapshots.filter(s => s.id !== oldest.id)
        }));
      }
    }
  },

  deleteSnapshot: async (id) => {
    await db.snapshots.delete(id);
    set((state) => ({
      snapshots: state.snapshots.filter(s => s.id !== id)
    }));
  },

  restoreSnapshot: async (id) => {
    const snap = await db.snapshots.get(id);
    if (snap) {
      // Overwrite current IndexedDB tables
      await db.registros.clear();
      await db.registros.bulkAdd(snap.registros);
      
      await db.authorizedPeople.clear();
      await db.authorizedPeople.bulkAdd(snap.authorizedPeople);

      set({
        registros: [...snap.registros].sort((a, b) => b.rawDate.localeCompare(a.rawDate)),
        authorizedPeople: snap.authorizedPeople
      });
    } else {
      throw new Error(`Snapshot ${id} not found.`);
    }
  },

  importLogs: async (logs) => {
    // Structural verification is handled by utility parser, but we make sure they go into DB
    for (const log of logs) {
      await db.registros.put(log);
    }
    const updatedLogs = await db.registros.reverse().toArray();
    set({ registros: updatedLogs });
    await get().createBackupSnapshot();
  },

  importAuthorizedPeople: async (people) => {
    for (const person of people) {
      await db.authorizedPeople.put(person);
    }
    const updatedAuth = await db.authorizedPeople.toArray();
    set({ authorizedPeople: updatedAuth });
    await get().createBackupSnapshot();
  }
}));
