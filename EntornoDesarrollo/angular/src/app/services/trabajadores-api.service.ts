import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Trabajador } from '../models/trabajador.model';
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
  protected readonly API_URL = `${environment.apiUrl}/trabajadores`;

  // ── GET (paginado + stats + JOINs) ─────────────────────────────────────────
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

      // Si el CTE devolvió stats pero sin registros filtrados
      if (raw.length === 1 && first.id == null) {
        return { data: [], totalFiltered: 0, stats };
      }

      // Limpiar campos de stats de cada registro
      const data: Trabajador[] = raw.map(item => {
        const { total_filtered, stats_total, stats_activos, stats_inactivos, stats_freelances, ...cleanItem } = item;
        return cleanItem as Trabajador;
      });

      return { data, totalFiltered: first.total_filtered ?? raw.length, stats };
    }));
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  create(data: any): Observable<Trabajador> {
    const { documentos, ...rest } = data;
    const trabajadorData = Object.fromEntries(
      Object.entries(rest).map(([key, val]) => [key, val === undefined ? null : val])
    );
    return this._create({ action: 'createTrabajador', trabajadorData, documentos });
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  update(id: number, data: any): Observable<Trabajador> {
    const trabajadorData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
    );
    return this._update({ action: 'updateTrabajador', trabajadorId: id, trabajadorData });
  }

  // ── TOGGLE STATUS ──────────────────────────────────────────────────────────
  toggleStatus(id: number): Observable<Trabajador> {
    return this._toggleStatus({ action: 'toggleTrabajadorStatus', trabajadorId: id });
  }

  // ── LOOKUPS ────────────────────────────────────────────────────────────────
  getProvincias(): Observable<{id: number, nombre: string}[]> {
    return this.http.post<{data: {id: number, nombre: string}[]}>(this.API_URL, { action: 'getProvincias' })
      .pipe(map(res => res.data ?? []));
  }

  getLocalidades(): Observable<{id: number, id_provincia: number, nombre: string}[]> {
    return this.http.post<{data: {id: number, id_provincia: number, nombre: string}[]}>(this.API_URL, { action: 'getLocalidades' })
      .pipe(map(res => res.data ?? []));
  }

  getSeleccionadoresLookup(): Observable<{id: number, nombre: string, tipo: string}[]> {
    return this.http.post<{data: {id: number, nombre: string, tipo: string}[]}>(this.API_URL, { action: 'getSeleccionadoresLookup' })
      .pipe(map(res => res.data ?? []));
  }

  getTiposDoc(): Observable<{id: number, tipo: string}[]> {
    return this.http.post<{data: {id: number, tipo: string}[]}>(this.API_URL, { action: 'getTiposDoc' })
      .pipe(map(res => res.data ?? []));
  }

  // ── RELACIONES POR TRABAJADOR ──────────────────────────────────────────────
  getAsignacionesByTrabajador(trabajadorId: number): Observable<any[]> {
    return this.http.post<{data: any[]}>(this.API_URL, { action: 'getAsignacionesByTrabajador', trabajadorId })
      .pipe(map(res => res.data ?? []));
  }

  getFormacionesByTrabajador(trabajadorId: number): Observable<any[]> {
    return this.http.post<{data: any[]}>(this.API_URL, { action: 'getFormacionesByTrabajador', trabajadorId })
      .pipe(map(res => res.data ?? []));
  }

  getDocumentosByTrabajador(trabajadorId: number): Observable<any[]> {
    return this.http.post<{data: any[]}>(this.API_URL, { action: 'getDocumentosByTrabajador', trabajadorId })
      .pipe(map(res => res.data ?? []));
  }

  uploadDocumento(data: any): Observable<any> {
    return this.http.post<{data: any}>(this.API_URL, { action: 'uploadDocumento', data })
      .pipe(map(res => res.data));
  }

  updateDocumento(data: any): Observable<any> {
    return this.http.post<{data: any}>(this.API_URL, { action: 'updateDocumento', data })
      .pipe(map(res => res.data));
  }

  deleteDocumento(documentoId: number): Observable<any> {
    return this.http.post<{data: any}>(this.API_URL, { action: 'deleteDocumento', documentoId })
      .pipe(map(res => res.data));
  }
}
