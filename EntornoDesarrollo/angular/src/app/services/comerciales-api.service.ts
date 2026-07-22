import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comercial } from '../models/comercial.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

export interface ComercialStats {
  total: number;
  activos: number;
  inactivos: number;
}

export interface ComercialPage {
  data: Comercial[];
  totalFiltered: number;
  stats: ComercialStats;
}

@Injectable({ providedIn: 'root' })
export class ComercialesApiService extends BaseCrud<Comercial> {

  // 🟢 CORREGIDO: Se especifica public override y el prefijo /api/ para coincidir con routes/api.php en Laravel
  public override readonly API_URL = `${environment.apiUrl}/api/comerciales`;

  findAll(page = 1, limit = 10, searchText = '', status = ''): Observable<ComercialPage> {
    return this.http.post<{ data: any[] }>(this.API_URL, {
      action: 'getAll', page, limit, filters: { searchText, status }
    }).pipe(
      map(res => {
        // Validación segura con res?.data en caso de respuesta vacía de n8n
        const raw = res?.data ?? [];

        if (raw.length === 0) {
          return {
            data: [],
            totalFiltered: 0,
            stats: { total: 0, activos: 0, inactivos: 0 }
          };
        }

        const first = raw[0];
        const stats: ComercialStats = {
          total: first.stats_total ?? 0,
          activos: first.stats_activos ?? 0,
          inactivos: first.stats_inactivos ?? 0
        };

        const totalFiltered: number = first.total_filtered ?? raw.length;

        // Limpiamos los registros eliminando la fila fantasma de SQL (id === null) y las métricas internas
        const data: Comercial[] = raw
          .filter(item => item && item.id !== null)
          .map(item => {
            const { total_filtered, stats_total, stats_activos, stats_inactivos, ...sel } = item;
            return sel as Comercial;
          });

        return { data, totalFiltered, stats };
      })
    );
  }

  create(data: Comercial): Observable<Comercial> {
    return this._create({ action: 'create', comercialData: data });
  }

  update(id: number, data: Comercial): Observable<Comercial> {
    return this._update({ action: 'update', comercialId: id, comercialData: data });
  }

  toggleStatus(id: number): Observable<Comercial> {
    return this._toggleStatus({ action: 'toggleStatus', comercialId: id });
  }
}
