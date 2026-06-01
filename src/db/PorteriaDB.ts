import Dexie, { type Table } from 'dexie';
import { RegistroMovimiento, AuthorizedPerson } from '../types';

export interface LocalSnapshot {
  id?: number;
  timestamp: string;
  registros: RegistroMovimiento[];
  authorizedPeople: AuthorizedPerson[];
}

export class PorteriaDatabase extends Dexie {
  registros!: Table<RegistroMovimiento, string>;
  authorizedPeople!: Table<AuthorizedPerson, string>;
  snapshots!: Table<LocalSnapshot, number>;

  constructor() {
    super('PorteriaDB');
    
    // Schema syntax: 'primaryKey, index1, index2, ...'
    // id is key for registros, rut is key for authorizedPeople, autoincrement ++id for snapshots
    this.version(1).stores({
      registros: 'id, timestamp, rawDate, tipoIngreso, rut, nombre, patente, accion',
      authorizedPeople: 'rut, nombre, tipoIngreso, patente',
      snapshots: '++id, timestamp'
    });
  }
}

export const db = new PorteriaDatabase();
