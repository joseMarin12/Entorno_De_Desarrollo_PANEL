import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Trabajador, TrabajadorFormData } from '../models/trabajador.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

export interface TrabajadorStats {
  total: number;
  activos: number;
  inactivos: number;
  freelances: number;
}

export interface TrabajadorPage {
  data: Trabajador[];
  totalFiltered: number;
  stats: TrabajadorStats;
}

@Injectable({ providedIn: 'root' })
export class TrabajadoresApiService extends BaseCrud<Trabajador> {
  
  // Actualizado para apuntar al prefijo /api del proxy de Laravel igual que en producción
  public override readonly API_URL = `${environment.apiUrl}/api/trabajadores`;

  findAll(page = 1, limit = 10, searchText = '', status = '', tipo = ''): Observable<TrabajadorPage> {
    return this.http.post<{ data: any[] }>(this.API_URL, {
      action: 'getTrabajadores', page, limit, filters: { searchText, status, tipo }
    }).pipe(map(res => {
      const raw = res.data ?? [];

      if (raw.length === 0) {
        return { data: [], totalFiltered: 0, stats: { total: 0, activos: 0, inactivos: 0, freelances: 0 } };
      }

      const first = raw[0];
      const stats: TrabajadorStats = {
        total: first.stats_total ?? 0,
        activos: first.stats_activos ?? 0,
        inactivos: first.stats_inactivos ?? 0,
        freelances: first.stats_freelances ?? 0
      };

      if (raw.length === 1 && first.id == null) {
        return { data: [], totalFiltered: 0, stats };
      }

      const data: Trabajador[] = raw.map(item => {
        const { total_filtered, stats_total, stats_activos, stats_inactivos, stats_freelances, ...cleanItem } = item;
        return cleanItem as Trabajador;
      });

      return { data, totalFiltered: first.total_filtered ?? raw.length, stats };
    }));
  }

  create(data: TrabajadorFormData): Observable<Trabajador> {
    const { documentos, ...rest } = data;
    const trabajadorData = Object.fromEntries(
      Object.entries(rest).map(([key, val]) => [key, val === undefined ? null : val])
    );
    return this._create({ action: 'createTrabajador', trabajadorData, documentos });
  }

  update(id: number, data: TrabajadorFormData): Observable<Trabajador> {
    const trabajadorData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
    );
    return this._update({ action: 'updateTrabajador', trabajadorId: id, trabajadorData });
  }

  toggleStatus(id: number): Observable<Trabajador> {
    return this._toggleStatus({ action: 'toggleTrabajadorStatus', trabajadorId: id });
  }

  getAsignacionesByTrabajador(trabajadorId: number): Observable<any[]> {
    return this.http.post<{data: any[]}>(this.API_URL, { action: 'getAsignacionesByTrabajador', trabajadorId })
      .pipe(map(res => res.data ?? []));
  }

  getFormacionesByTrabajador(trabajadorId: number): Observable<any[]> {
    return this.http.post<{data: any[]}>(this.API_URL, { action: 'getFormacionesByTrabajador', trabajadorId })
      .pipe(map(res => res.data ?? []));
  }

  getSeleccionadoresLookup(): Observable<{ id: number; nombre: string; tipo: string }[]> {
    return this._findAll({ action: 'getSeleccionadoresLookup' }) as unknown as Observable<{ id: number; nombre: string; tipo: string }[]>;
  }

  // Geografía: crea si no existe
  resolverPais(nombre: string): Observable<number> {
    return this.http.post<{ data: { id: number }[] }>(this.API_URL, { action: 'resolverPais', nombre })
      .pipe(map(res => res.data?.[0]?.id));
  }

  resolverProvincia(nombre: string, idPais: number): Observable<number> {
    return this.http.post<{ data: { id: number }[] }>(this.API_URL, { action: 'resolverProvincia', nombre, id_pais: idPais })
      .pipe(map(res => res.data?.[0]?.id));
  }

  resolverLocalidad(nombre: string, idProvincia: number): Observable<number> {
    return this.http.post<{ data: { id: number }[] }>(this.API_URL, { action: 'resolverLocalidad', nombre, id_provincia: idProvincia })
      .pipe(map(res => res.data?.[0]?.id));
  }
}
