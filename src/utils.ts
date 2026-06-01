import { RegistroMovimiento, TipoIngreso, TipoAccion, AuthorizedPerson } from './types';

// Helper to format Chilean RUT (e.g., 123456789 -> 12.345.678-9)
export function formatChileanRUT(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  
  if (body.length === 0) {
    return dv;
  }
  
  let formattedBody = '';
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    formattedBody = body[i] + formattedBody;
    count++;
    if (count === 3 && i > 0) {
      formattedBody = '.' + formattedBody;
      count = 0;
    }
  }
  
  return `${formattedBody}-${dv}`;
}

// Helper to validate Chilean RUT
export function validateChileanRUT(rutStr: string): boolean {
  const clean = rutStr.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return false;
  
  const dvInput = clean.slice(-1);
  const body = clean.slice(0, -1);
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    const digit = parseInt(body[i], 10);
    if (isNaN(digit)) return false;
    sum += digit * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDvNum = 11 - (sum % 11);
  let expectedDv = '';
  if (expectedDvNum === 11) expectedDv = '0';
  else if (expectedDvNum === 10) expectedDv = 'K';
  else expectedDv = expectedDvNum.toString();
  
  return expectedDv === dvInput;
}

// Format Chilean Vehicular Patente (e.g., ABCD12 -> ABCD-12)
export function formatPatente(patente: string): string {
  const clean = patente.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  
  if (clean === 'PEATON' || clean === 'PEATÓN') {
    return 'Peatón';
  }
  
  if (clean.length === 6) {
    const letters = clean.replace(/[^A-Z]/g, '').length;
    if (letters === 4) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    } else {
      return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }
  }
  return clean;
}

// Prettify timestamp "DD/MM/YYYY HH:MM:SS" for Chile Zone
export function formatChileanDate(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  const hora = String(date.getHours()).padStart(2, '0');
  const minuto = String(date.getMinutes()).padStart(2, '0');
  const segundo = String(date.getSeconds()).padStart(2, '0');
  return `${dia}/${mes}/${anio} ${hora}:${minuto}:${segundo}`;
}

// Valid custom type guards and normalizers
export function isValidTipoIngreso(val: any): val is TipoIngreso {
  return ['Visita', 'Proveedor', 'Residente', 'Contratista'].includes(val);
}

export function isValidTipoAccion(val: any): val is TipoAccion {
  return ['INGRESO', 'SALIDA'].includes(val);
}

export function validateAndNormalizeLog(item: any): RegistroMovimiento | null {
  if (!item || typeof item !== 'object') return null;
  
  const rut = typeof item.rut === 'string' ? item.rut.trim() : '';
  const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : '';
  
  if (!rut || !nombre) return null;
  
  const tipoIngreso: TipoIngreso = isValidTipoIngreso(item.tipoIngreso) ? item.tipoIngreso : 'Visita';
  const accion: TipoAccion = isValidTipoAccion(item.accion) ? item.accion : 'INGRESO';
  
  let patente = 'Peatón';
  if (typeof item.patente === 'string' && item.patente.trim().length > 0) {
    patente = formatPatente(item.patente);
  }

  const rawDate = typeof item.rawDate === 'string' ? item.rawDate : new Date().toISOString();
  let timestamp = typeof item.timestamp === 'string' ? item.timestamp : '';
  if (!timestamp) {
    try {
      timestamp = formatChileanDate(new Date(rawDate));
    } catch {
      timestamp = formatChileanDate(new Date());
    }
  }

  const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `reg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  return {
    id,
    timestamp,
    rawDate,
    tipoIngreso,
    rut,
    nombre,
    patente,
    accion
  };
}

export function validateAndNormalizeAuthorizedPerson(item: any): AuthorizedPerson | null {
  if (!item || typeof item !== 'object') return null;
  
  const rawRut = typeof item.rut === 'string' ? item.rut.trim() : '';
  const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : '';
  
  if (!rawRut || !nombre) return null;
  
  const rut = formatChileanRUT(rawRut) || rawRut;
  const tipoIngreso: TipoIngreso = isValidTipoIngreso(item.tipoIngreso) ? item.tipoIngreso : 'Visita';
  
  let patente = 'Peatón';
  if (typeof item.patente === 'string' && item.patente.trim().length > 0) {
    patente = formatPatente(item.patente);
  }

  return {
    rut,
    nombre,
    tipoIngreso,
    patente
  };
}

export function safelyParseLogs(jsonStr: string): RegistroMovimiento[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(item => validateAndNormalizeLog(item))
      .filter((item): item is RegistroMovimiento => item !== null);
  } catch {
    return [];
  }
}

export function safelyParseAuthorizedPeople(jsonStr: string): AuthorizedPerson[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(item => validateAndNormalizeAuthorizedPerson(item))
      .filter((item): item is AuthorizedPerson => item !== null);
  } catch {
    return [];
  }
}

export const SAMPLE_REGISTROS: RegistroMovimiento[] = [
  {
    id: 'sample-1',
    timestamp: '25/05/2026 12:45:10',
    rawDate: '2026-05-25T12:45:10.000Z',
    tipoIngreso: 'Visita',
    rut: '12.345.678-9',
    nombre: 'Juan Pérez Silva',
    patente: 'Peatón',
    accion: 'INGRESO'
  },
  {
    id: 'sample-2',
    timestamp: '25/05/2026 11:30:15',
    rawDate: '2026-05-25T11:30:15.000Z',
    tipoIngreso: 'Contratista',
    rut: '15.678.901-K',
    nombre: 'María José Castro (Electricidad)',
    patente: 'HR-WT-24',
    accion: 'INGRESO'
  },
  {
    id: 'sample-3',
    timestamp: '25/05/2026 10:15:22',
    rawDate: '2026-05-25T10:15:22.000Z',
    tipoIngreso: 'Proveedor',
    rut: '11.222.333-4',
    nombre: 'Distribuidora Alimentos (Carlos Ruiz)',
    patente: 'DF-GR-88',
    accion: 'INGRESO'
  },
  {
    id: 'sample-4',
    timestamp: '25/05/2026 09:02:40',
    rawDate: '2026-05-25T09:02:40.000Z',
    tipoIngreso: 'Residente',
    rut: '18.456.789-2',
    nombre: 'Felipe Sandoval Torres',
    patente: 'GC-YY-33',
    accion: 'INGRESO'
  },
  {
    id: 'sample-5',
    timestamp: '25/05/2026 09:55:12',
    rawDate: '2026-05-25T09:55:12.000Z',
    tipoIngreso: 'Residente',
    rut: '18.456.789-2',
    nombre: 'Felipe Sandoval Torres',
    patente: 'GC-YY-33',
    accion: 'SALIDA'
  }
];

// Generates CSV Content for download. Includes BOM (\uFEFF) explicitly
export function exportToCSV(registros: RegistroMovimiento[]): string {
  const headers = ['Fecha/Hora', 'Tipo de Ingreso', 'RUT/Identificación', 'Nombre Completo', 'Vehículo/Patente', 'Acción'];
  const rows = registros.map(reg => [
    reg.timestamp,
    reg.tipoIngreso,
    reg.rut,
    reg.nombre,
    reg.patente,
    reg.accion
  ]);
  
  const CSVString = [
    headers.join(';'), 
    ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))
  ].join('\r\n'); // Use standard Excel CRLF
  
  return '\uFEFF' + CSVString;
}
