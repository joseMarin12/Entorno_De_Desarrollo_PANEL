import { Injectable, signal, computed } from '@angular/core';
import { Empresa } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private nextId = 6;

  private _empresas = signal<Empresa[]>([
    { id: 1, nombre: 'Nova Soluciones', razonSocial: 'S.L.', tipo: 'Consultoría' ,cif: 'B12345678', direcciones: 2, contactos: 1, activo: true  },
    { id: 2, nombre: 'Astra Digital', razonSocial: 'S.L.', tipo: 'Software' ,cif: 'B87654321', direcciones: 1, contactos: 2, activo: true  },
    { id: 3, nombre: 'Luna Tech', razonSocial: 'Consulting', tipo: 'Consultoría' ,cif: 'B23456789', direcciones: 3, contactos: 5, activo: false },
    { id: 4, nombre: 'Punto Verde', razonSocial: 'S.L.', tipo: 'Eco-Sostenible' ,cif: 'B34567890', direcciones: 1, contactos: 1, activo: true  },
    { id: 5, nombre: 'Kensa Group', razonSocial: 'S.A.', tipo: 'Servicios' ,cif: 'B45678901', direcciones: 2, contactos: 3, activo: true  },
  ]);

  readonly empresas = this._empresas.asReadonly();

  readonly total     = computed(() => this._empresas().length);
  readonly totalActivos   = computed(() => this._empresas().filter(e => e.activo).length);
  readonly totalInactivos = computed(() => this._empresas().filter(e => !e.activo).length);

  add(data: Omit<Empresa, 'id'>): void {
    this._empresas.update(list => [{ id: this.nextId++, ...data }, ...list]);
  }

  update(id: number, data: Omit<Empresa, 'id'>): void {
    this._empresas.update(list =>
      list.map(e => (e.id === id ? { id, ...data } : e))
    );
  }

  toggleActivo(id: number): void {
    this._empresas.update(list =>
      list.map(e => (e.id === id ? { ...e, activo: !e.activo } : e))
    );
  }

  getById(id: number): Empresa | undefined {
    return this._empresas().find(e => e.id === id);
  }

  fullName(e: Empresa): string {
    return [e.nombre, e.razonSocial].filter(Boolean).join(' ');
  }

  initials(e: Empresa): string {
    return ((e.nombre[0] ?? '') + (e.razonSocial[0] ?? '')).toUpperCase();
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
