import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { Trabajador } from '../models/trabajador.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FormacionTrabajadorService extends BaseCrud<Trabajador> {
// EL FIX: Añadimos /api/ y lo cambiamos a plural para hacer match con Laravel
public override readonly API_URL = `${environment.apiUrl}/api/formaciones`;

  // ── Estado reactivo ──────────────────────────────────────────────────────
  private _trabajadores = signal<Trabajador[]>([]);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);

  readonly trabajadores  = this._trabajadores.asReadonly();
  readonly disponibles   = computed(() => this._trabajadores().filter(t => !t.asignado));
  readonly participantes = computed(() => this._trabajadores().filter(t => t.asignado));

  // ── Carga de trabajadores ────────────────────────────────────────────────
  loadTrabajadores(idFormacion: number, searchText = '', soloDisponibles = false): Observable<Trabajador[]> {
    this.loading.set(true);
    this.error.set(null);
    return this._findAll({
      action: 'getTrabajadores',
      id_formacion: idFormacion,
      filters: { searchText, soloDisponibles }
    }).pipe(
      tap({
        next:  list => { this._trabajadores.set(list); this.loading.set(false); },
        error: e    => { this.error.set(e?.message ?? 'Error al cargar trabajadores'); this.loading.set(false); },
      })
    );
  }

  // ── Asignación ───────────────────────────────────────────────────────────
  addTrabajador(idFormacion: number, idTrabajador: number): Observable<Trabajador> {
    this.loading.set(true);
    this.error.set(null);
    return this._create({
      action: 'addTrabajadorToFormacion',
      id_formacion: idFormacion,
      id_trabajador: idTrabajador
    }).pipe(
      tap({
        next:  () => { this._trabajadores.update(list => list.map(t => t.id === idTrabajador ? { ...t, asignado: true } : t)); this.loading.set(false); },
        error: e  => { this.error.set(e?.message ?? 'Error al añadir participante'); this.loading.set(false); },
      })
    );
  }

  removeTrabajador(idFormacion: number, idTrabajador: number): Observable<Trabajador> {
    this.loading.set(true);
    this.error.set(null);
    return this._update({
      action: 'removeTrabajadorFromFormacion',
      id_formacion: idFormacion,
      id_trabajador: idTrabajador
    }).pipe(
      tap({
        next:  () => { this._trabajadores.update(list => list.map(t => t.id === idTrabajador ? { ...t, asignado: false } : t)); this.loading.set(false); },
        error: e  => { this.error.set(e?.message ?? 'Error al quitar participante'); this.loading.set(false); },
      })
    );
  }
}
