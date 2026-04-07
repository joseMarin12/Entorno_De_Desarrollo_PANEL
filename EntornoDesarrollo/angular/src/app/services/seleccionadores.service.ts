import { Injectable, signal, computed } from '@angular/core';
import { Seleccionador } from '../models/seleccionador.model';

@Injectable({ providedIn: 'root' })
export class SeleccionadoresService {
  private nextId = 7;

  private _seleccionadores = signal<Seleccionador[]>([
    { id: 1, nombre: 'Javier',  ap1: 'Morales',  ap2: 'Fernández', activo: true  },
    { id: 2, nombre: 'Laura',   ap1: 'García',   ap2: 'Pérez',     activo: true  },
    { id: 3, nombre: 'Antonio', ap1: 'Sanz',     ap2: 'López',     activo: true  },
    { id: 4, nombre: 'María',   ap1: 'Pérez',    ap2: 'Romero',    activo: true  },
    { id: 5, nombre: 'Carlos',  ap1: 'Ruiz',     ap2: 'Blanco',    activo: true  },
    { id: 6, nombre: 'Roberto', ap1: 'Jiménez',  ap2: 'Castro',    activo: false },
  ]);

  readonly seleccionadores = this._seleccionadores.asReadonly();
  readonly total     = computed(() => this._seleccionadores().length);
  readonly activos   = computed(() => this._seleccionadores().filter(s => s.activo).length);
  readonly inactivos = computed(() => this._seleccionadores().filter(s => !s.activo).length);

  add(data: Omit<Seleccionador, 'id'>): void {
    this._seleccionadores.update(list => [
      ...list,
      { id: this.nextId++, ...data }
    ]);
  }

  update(id: number, data: Omit<Seleccionador, 'id'>): void {
    this._seleccionadores.update(list =>
      list.map(s => s.id === id ? { id, ...data } : s)
    );
  }

  toggleActivo(id: number): void {
    this._seleccionadores.update(list =>
      list.map(s => s.id === id ? { ...s, activo: !s.activo } : s)
    );
  }

  getById(id: number): Seleccionador | undefined {
    return this._seleccionadores().find(s => s.id === id);
  }

  fullName(s: Seleccionador): string {
    return [s.nombre, s.ap1, s.ap2].filter(Boolean).join(' ');
  }

  initials(s: Seleccionador): string {
    return ((s.nombre[0] ?? '') + (s.ap1[0] ?? '')).toUpperCase();
  }

  colorFor(id: number): string {
    const COLORS = [
      'linear-gradient(135deg,#5a4d9a,#3198bf)',
      'linear-gradient(135deg,#3198bf,#23b4cd)',
      'linear-gradient(135deg,#476fab,#3198bf)',
      'linear-gradient(135deg,#55569e,#476fab)',
      'linear-gradient(135deg,#23b4cd,#3198bf)',
      'linear-gradient(135deg,#5a4d9a,#476fab)',
    ];
    return COLORS[(id - 1) % COLORS.length];
  }
}
