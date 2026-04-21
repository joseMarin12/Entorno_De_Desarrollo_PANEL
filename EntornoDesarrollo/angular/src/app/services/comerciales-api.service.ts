import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comercial } from '../models/comercial.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

export interface ComercialPage {
  data: Comercial[];
  total: number;
  totalActivos: number;
  totalInactivos: number;
}

@Injectable({ providedIn: 'root' })
export class ComercialesApiService extends BaseCrud<Comercial> {
  protected readonly API_URL = `${environment.apiUrl}/comerciales`;

  /**
   * Obtiene una página de comerciales del servidor.
   * El backend aplica LIMIT/OFFSET y devuelve el total real.
   */
  findAll(
    searchText = '',
    status     = '',
    page       = 1,
    limit      = 6,
  ): Observable<ComercialPage> {
    return this.http.post<ComercialPage>(this.API_URL, {
      action: 'getAll',
      filters: { searchText, status },
      page,
      limit,
    });
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
