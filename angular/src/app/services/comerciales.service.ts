import { Injectable, signal, computed } from '@angular/core';
import { Comercial } from '../models/comercial.model';

@Injectable({ providedIn: 'root' })
export class ComercialesService {
  private nextId = 6;

  private _comerciales = signal<Comercial[]>([
    { id: 1, nombre: 'Laura',  apellido1: 'García',  apellido2: 'Fernández', telefono: '+34 612 345 678', email: 'l.garcia@sgtech.tech',  activo: true  },
    { id: 2, nombre: 'Marcos', apellido1: 'Ruiz',    apellido2: 'Soto',      telefono: '+34 698 011 234', email: 'm.ruiz@sgtech.tech',    activo: true  },
    { id: 3, nombre: 'Ana',    apellido1: 'Pérez',   apellido2: '',          telefono: '+34 655 789 012', email: 'a.perez@sgtech.tech',   activo: false },
    { id: 4, nombre: 'Javier', apellido1: 'Molina',  apellido2: 'López',     telefono: '+34 634 567 890', email: 'j.molina@sgtech.tech',  activo: true  },
    { id: 5, nombre: 'Sara',   apellido1: 'Torres',  apellido2: 'Gil',       telefono: '+34 677 222 333', email: 's.torres@sgtech.tech',  activo: true  },
  ]);

  readonly comerciales = this._comerciales.asReadonly();

  readonly totalActivos   = computed(() => this._comerciales().filter(c => c.activo).length);
  readonly totalInactivos = computed(() => this._comerciales().filter(c => !c.activo).length);
  readonly total          = computed(() => this._comerciales().length);

  add(data: Omit<Comercial, 'id'>): void {
    this._comerciales.update(list => [{ id: this.nextId++, ...data }, ...list]);
  }

  update(id: number, data: Omit<Comercial, 'id'>): void {
    this._comerciales.update(list =>
      list.map(c => (c.id === id ? { id, ...data } : c))
    );
  }

  toggleActivo(id: number): void {
    this._comerciales.update(list =>
      list.map(c => (c.id === id ? { ...c, activo: !c.activo } : c))
    );
  }

  getById(id: number): Comercial | undefined {
    return this._comerciales().find(c => c.id === id);
  }

  fullName(c: Comercial): string {
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  initials(c: Comercial): string {
    return (c.nombre[0] + c.apellido1[0]).toUpperCase();
  }

  colorFor(id: number): string {
    const COLORS = [
      'linear-gradient(135deg,#5a4d9a,#476fab)',
      'linear-gradient(135deg,#476fab,#23b4cd)',
      'linear-gradient(135deg,#3198bf,#23b4cd)',
      'linear-gradient(135deg,#55569e,#3198bf)',
      'linear-gradient(135deg,#5a4d9a,#23b4cd)',
    ];
    return COLORS[(id - 1) % COLORS.length];
  }
}
