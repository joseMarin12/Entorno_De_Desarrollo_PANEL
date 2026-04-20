import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Trabajador } from '../models/trabajador.model';

const API_URL = 'http://localhost:8000/api/formaciones';

@Injectable({ providedIn: 'root' })
export class FormacionTrabajadorService {
  private http = inject(HttpClient);

  private _trabajadores = signal<Trabajador[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly trabajadores = this._trabajadores.asReadonly();
  
  readonly disponibles = computed(() => this._trabajadores().filter(t => !t.asignado));
  readonly participantes = computed(() => this._trabajadores().filter(t => t.asignado));

  async loadTrabajadores(idFormacion: number, searchText = '', soloDisponibles = false): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Trabajador[] }>(API_URL, {
          action: 'getTrabajadores',
          id_formacion: idFormacion,
          filters: { searchText, soloDisponibles }
        })
      );
      this._trabajadores.set(res.data ?? []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cargar trabajadores');
    } finally {
      this.loading.set(false);
    }
  }

  async setAsignado(idFormacion: number, idTrabajador: number, asignar: boolean): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const action = asignar ? 'addTrabajadorToFormacion' : 'removeTrabajadorFromFormacion';
      await firstValueFrom(
        this.http.post(API_URL, {
          action,
          id_formacion: idFormacion,
          id_trabajador: idTrabajador
        })
      );
      
      // Update local state without reloading
      this._trabajadores.update(list => list.map(t => 
        t.id === idTrabajador ? { ...t, asignado: asignar } : t
      ));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al modificar participante');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }
}
