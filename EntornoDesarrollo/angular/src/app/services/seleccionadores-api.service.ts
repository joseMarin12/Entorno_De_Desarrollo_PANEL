import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
        return { 
          data: [], 
          totalFiltered: 0, 
          stats: { total: 0, activos: 0, inactivos: 0, externos: 0 } 
        };
      }

    
      const first = raw[0];
      const stats: SeleccionadorStats = {
        total: first.stats_total ?? 0,
        activos: first.stats_activos ?? 0,
        inactivos: first.stats_inactivos ?? 0,
        externos: first.stats_externos ?? 0
      };

      
      if (raw.length === 1 && first.id == null) {
        return { data: [], totalFiltered: 0, stats };
      }

     
      const data: Seleccionador[] = raw.map(item => {
        const { total_filtered, stats_total, stats_activos, stats_inactivos, stats_externos, ...cleanItem } = item;
        return cleanItem as Seleccionador;
      });

      return { 
        data, 
        totalFiltered: first.total_filtered ?? raw.length, 
        stats 
      };
    }));
  }

  create(data: Omit<Seleccionador, 'id'>): Observable<Seleccionador> {
 
    const seleccionadorData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
    );
   
    if (seleccionadorData['tipo']) {
      seleccionadorData['tipo'] = String(seleccionadorData['tipo']).toLowerCase().trim();
    }
    return this._create({ action: 'createSeleccionador', seleccionadorData });
  }

  update(id: number, data: Partial<Seleccionador>): Observable<Seleccionador> {
    const seleccionadorData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
    );
    return this._update({ action: 'updateSeleccionador', seleccionadorId: id, seleccionadorData });
  }

  toggleStatus(id: number): Observable<Seleccionador> {
    return this._toggleStatus({ action: 'toggleSeleccionadorStatus', seleccionadorId: id });
  }

  getEmpresas(): Observable<{id: number, nombre: string}[]> {
    return this.http.post<{data: {id: number, nombre: string}[]}>(this.API_URL, { action: 'getEmpresas' })
      .pipe(map(res => res.data ?? []));
  }
}
