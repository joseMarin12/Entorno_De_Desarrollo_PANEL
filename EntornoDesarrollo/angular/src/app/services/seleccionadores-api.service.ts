import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http'; // Asegura esta importación
import { Seleccionador } from '../models/seleccionador.model';
import { BaseCrud } from './base.service';

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
  // URL directa al webhook de n8n
  protected readonly API_URL = 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-seleccionadores';

  // Función interna para obtener y limpiar el JWT del localStorage
  private getOptionsWithAuth() {
    let token = localStorage.getItem('token'); 

    // Si viene guardado como un string JSON plano (ej: '[{"token":"..."}]' o '{"token":"..."}')
    if (token && (token.startsWith('{') || token.startsWith('['))) {
      try {
        const parsed = JSON.parse(token);
        token = Array.isArray(parsed) ? parsed[0].token : parsed.token;
      } catch (e) {
        console.error('Error al procesar el JSON del token:', e);
      }
    }

    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  findAll(page = 1, limit = 10, searchText = '', status = '', tipo = ''): Observable<SeleccionadorPage> {
    return this.http.post<{ data: any[] }>(this.API_URL, {
      action: 'getSeleccionadores', page, limit, filters: { searchText, status, tipo }
    }, this.getOptionsWithAuth()).pipe(map(res => {
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

    // Enviamos directo por HTTP POST incluyendo la cabecera de autenticación limpia
    return this.http.post<Seleccionador>(this.API_URL, { 
      action: 'createSeleccionador', 
      seleccionadorData 
    }, this.getOptionsWithAuth());
  }

  update(id: number, data: Partial<Seleccionador>): Observable<Seleccionador> {
    const seleccionadorData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
    );

    // Enviamos directo por HTTP POST incluyendo la cabecera de autenticación limpia
    return this.http.post<Seleccionador>(this.API_URL, { 
      action: 'updateSeleccionador', 
      seleccionadorId: id, 
      seleccionadorData 
    }, this.getOptionsWithAuth());
  }

  toggleStatus(id: number): Observable<Seleccionador> {
    // Enviamos directo por HTTP POST incluyendo la cabecera de autenticación limpia
    return this.http.post<Seleccionador>(this.API_URL, { 
      action: 'toggleSeleccionadorStatus', 
      seleccionadorId: id 
    }, this.getOptionsWithAuth());
  }

  getEmpresas(): Observable<{id: number, nombre: string}[]> {
    return this.http.post<{data: {id: number, nombre: string}[]}>(this.API_URL, { 
      action: 'getEmpresas' 
    }, this.getOptionsWithAuth()).pipe(map(res => res.data ?? []));
  }
}
