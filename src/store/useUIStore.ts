import { create } from 'zustand';
import { TipoIngreso, TipoAccion } from '../types';

let toastTimer: ReturnType<typeof setTimeout> | null = null;

interface UIState {
  activeTab: 'registro' | 'frecuentes' | 'exportar' | 'importar';
  darkMode: boolean;
  toastMessage: string | null;
  editingId: string | null;
  
  // Inline edit state
  editNombre: string;
  editPatente: string;
  editEditTipoIngreso: TipoIngreso;

  // Form states
  rut: string;
  nombre: string;
  patente: string;
  tipoIngreso: TipoIngreso;
  saveAsFrequent: boolean;
  isPasaporte: boolean;
  autoFilledStatus: string | null;

  // Interactive filters
  searchQuery: string;
  filterAccion: 'TODOS' | TipoAccion;
  filterTipo: 'TODOS' | TipoIngreso;

  // 1-Tap filters
  frecuentesSearchQuery: string;
  frecuentesClassFilter: 'TODOS' | TipoIngreso;

  // Setters and Actions
  setActiveTab: (tab: 'registro' | 'frecuentes' | 'exportar' | 'importar') => void;
  setDarkMode: (dark: boolean) => void;
  triggerToast: (message: string) => void;
  clearToast: () => void;
  
  setEditing: (id: string | null, nombre?: string, patente?: string, tipo?: TipoIngreso) => void;
  setEditFields: (updates: Partial<{ editNombre: string; editPatente: string; editEditTipoIngreso: TipoIngreso }>) => void;
  
  setForm: (updates: Partial<{
    rut: string;
    nombre: string;
    patente: string;
    tipoIngreso: TipoIngreso;
    saveAsFrequent: boolean;
    isPasaporte: boolean;
    autoFilledStatus: string | null;
  }>) => void;
  resetForm: () => void;

  setFilters: (updates: Partial<{
    searchQuery: string;
    filterAccion: 'TODOS' | TipoAccion;
    filterTipo: 'TODOS' | TipoIngreso;
    frecuentesSearchQuery: string;
    frecuentesClassFilter: 'TODOS' | TipoIngreso;
  }>) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'registro',
  darkMode: (() => {
    const saved = localStorage.getItem('darkMode_porteria');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  })(),
  toastMessage: null,
  editingId: null,

  editNombre: '',
  editPatente: '',
  editEditTipoIngreso: 'Visita',

  rut: '',
  nombre: '',
  patente: '',
  tipoIngreso: 'Visita',
  saveAsFrequent: false,
  isPasaporte: false,
  autoFilledStatus: null,

  searchQuery: '',
  filterAccion: 'TODOS',
  filterTipo: 'TODOS',

  frecuentesSearchQuery: '',
  frecuentesClassFilter: 'TODOS',

  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setDarkMode: (dark) => {
    set({ darkMode: dark });
    localStorage.setItem('darkMode_porteria', String(dark));
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  triggerToast: (message) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    set({ toastMessage: message });
    toastTimer = setTimeout(() => {
      set({ toastMessage: null });
      toastTimer = null;
    }, 4000);
  },

  clearToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toastMessage: null });
  },

  setEditing: (id, nombre = '', patente = '', tipo = 'Visita') => {
    set({
      editingId: id,
      editNombre: nombre,
      editPatente: patente,
      editEditTipoIngreso: tipo
    });
  },

  setEditFields: (updates) => set((state) => ({ ...state, ...updates })),

  setForm: (updates) => set((state) => ({ ...state, ...updates })),
  
  resetForm: () => set({
    rut: '',
    nombre: '',
    patente: '',
    tipoIngreso: 'Visita',
    saveAsFrequent: false,
    isPasaporte: false,
    autoFilledStatus: null
  }),

  setFilters: (updates) => set((state) => ({ ...state, ...updates }))
}));
