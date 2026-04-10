import { Injectable, signal, computed } from '@angular/core';
import { Seleccionador } from '../models/seleccionador.model';

@Injectable({ providedIn: 'root' })
export class SeleccionadoresService {
  private nextId = 8;

  private _seleccionadores = signal<Seleccionador[]>([
    {
      id: 1,
      nombre: 'Javier',
      ap1: 'Morales',
      ap2: 'Fernández',
      telefono: '612 345 678',
      email: 'javier.morales@sgtech.com',
      tipo: 'interno',
      activo: true,
    },
    {
      id: 2,
      nombre: 'Laura',
      ap1: 'García',
      ap2: 'Pérez',
      telefono: '623 456 789',
      email: 'laura.garcia@sgtech.com',
      tipo: 'interno',
      activo: true,
    },
    {
      id: 3,
      nombre: 'Antonio',
      ap1: 'Sanz',
      ap2: 'López',
      telefono: '634 567 890',
      email: 'antonio.sanz@talentexpert.es',
      tipo: 'externo',
      activo: true,
      empresaVinculada: { id: 1, nombre: 'Talent Expert SL' },
      fechaInicio: '2024-03-01',
      salario: 38000,
      fee: 15,
    },
    {
      id: 4,
      nombre: 'María',
      ap1: 'Pérez',
      ap2: 'Romero',
      telefono: '645 678 901',
      email: 'maria.perez@recrupro.es',
      tipo: 'externo',
      activo: true,
      empresaVinculada: { id: 2, nombre: 'RecruPro España' },
      fechaInicio: '2024-06-15',
      salario: 42000,
      fee: 18,
    },
    {
      id: 5,
      nombre: 'Carlos',
      ap1: 'Ruiz',
      ap2: 'Blanco',
      telefono: '656 789 012',
      email: 'carlos.ruiz@sgtech.com',
      tipo: 'interno',
      activo: true,
    },
    {
      id: 6,
      nombre: 'Roberto',
      ap1: 'Jiménez',
      ap2: 'Castro',
      telefono: '667 890 123',
      email: 'roberto.jimenez@headhunting.es',
      tipo: 'externo',
      activo: false,
      empresaVinculada: { id: 3, nombre: 'HeadHunting Pro' },
      fechaInicio: '2023-11-01',
      salario: 35000,
      fee: 12,
    },
    {
      id: 7,
      nombre: 'Sara',
      ap1: 'Navarro',
      ap2: 'Torres',
      telefono: '678 901 234',
      email: 'sara.navarro@sgtech.com',
      tipo: 'interno',
      activo: true,
    },
  ]);

  readonly seleccionadores = this._seleccionadores.asReadonly();
  readonly total     = computed(() => this._seleccionadores().length);
  readonly activos   = computed(() => this._seleccionadores().filter(s => s.activo).length);
  readonly inactivos = computed(() => this._seleccionadores().filter(s => !s.activo).length);
  readonly externos  = computed(() => this._seleccionadores().filter(s => s.tipo === 'externo').length);

  // Listado de empresas disponibles para el formulario
  readonly empresasDisponibles = [
    { id: 1, nombre: 'Talent Expert SL' },
    { id: 2, nombre: 'RecruPro España' },
    { id: 3, nombre: 'HeadHunting Pro' },
    { id: 4, nombre: 'Global Talent Group' },
    { id: 5, nombre: 'Top Recruit España' },
  ];

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
