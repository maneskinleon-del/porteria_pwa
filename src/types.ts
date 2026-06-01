export type TipoIngreso = 'Visita' | 'Proveedor' | 'Residente' | 'Contratista';
export type TipoAccion = 'INGRESO' | 'SALIDA';

export interface RegistroMovimiento {
  id: string;
  timestamp: string; // Formatted date/time "DD/MM/YYYY HH:MM:SS"
  rawDate: string; // ISO string for sorting/filtering
  tipoIngreso: TipoIngreso;
  rut: string;
  nombre: string;
  patente: string; // 'Peatón' if empty
  accion: TipoAccion;
}

export interface PorteriaStats {
  totalIngresos: number;
  totalSalidas: number;
  personasEnRecinto: number;
}

export interface AuthorizedPerson {
  rut: string;
  nombre: string;
  tipoIngreso: TipoIngreso;
  patente?: string;
}
