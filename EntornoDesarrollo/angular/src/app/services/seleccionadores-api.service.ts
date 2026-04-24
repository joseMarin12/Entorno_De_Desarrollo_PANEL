import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seleccionador } from '../models/seleccionador.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

export interface SeleccionadorStats {
  total: number;
  activos: number;
  inactivos: number;
  externos: number;
}

export interface SeleccionadorPage {
  data: Seleccionador[];
  totalFiltered: number;
  stats: SeleccionadorStats;
}

@Injectable({ providedIn: 'root' })
export class SeleccionadoresApiService extends BaseCrud<Seleccionador> {
  protected readonly API_URL = `${environment.apiUrl}/seleccionadores`;

  findAll(page = 1, limit = 10, searchText = '', status = '', tipo = ''): Observable<SeleccionadorPage> {
    return this.http.post<{ data: any[] }>(this.API_URL, {
      action: 'getSeleccionadores', page, limit, filters: { searchText, status, tipo }
    }).pipe(map(res => {
      const raw = res.data ?? [];
      if (raw.length === 0) {
        return { data: [], totalFiltered: 0, stats: { total: 0, activos: 0, inactivos: 0, externos: 0 } };
      }
      const first = raw[0];
      const stats: SeleccionadorStats = {
        total: first.stats_total ?? 0, activos: first.stats_activos ?? 0,
        inactivos: first.stats_inactivos ?? 0, externos: first.stats_externos ?? 0
      };
      const totalFiltered: number = first.total_filtered ?? raw.length;
      const data: Seleccionador[] = raw.map(item => {
        const { total_filtered, stats_total, stats_activos, stats_inactivos, stats_externos, ...sel } = item;
        return sel as Seleccionador;
      });
      return { data, totalFiltered, stats };
    }));
  }

  create(data: Omit<Seleccionador, 'id'>): Observable<Seleccionador> {
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => {
        let value = val === undefined ? null : val;
        if (key === 'tipo' && typeof value === 'string') { value = value.toLowerCase().trim(); }
        return [key, value];
      })
    );
    return this._create({ action: 'createSeleccionador', seleccionadorData: cleanData });
  }

  update(id: number, data: Partial<Seleccionador>): Observable<Seleccionador> {
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
    );
    return this._update({ action: 'updateSeleccionador', seleccionadorId: id, seleccionadorData: cleanData });
  }

  toggleStatus(id: number): Observable<Seleccionador> {
    return this._toggleStatus({ action: 'toggleSeleccionadorStatus', seleccionadorId: id });
  }

  getEmpresas(): Observable<{id: number, nombre: string}[]> {
    return this.http.post<{data: {id: number, nombre: string}[]}>(this.API_URL, { action: 'getEmpresas' })
      .pipe(map(res => res.data ?? []));
  }
}
