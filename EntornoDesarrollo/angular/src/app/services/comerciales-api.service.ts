import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comercial } from '../models/comercial.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComercialesApiService extends BaseCrud<Comercial> {
  protected readonly API_URL = `${environment.apiUrl}/comerciales`;

  findAll(searchText = '', status = ''): Observable<Comercial[]> {
    return this._findAll({ action: 'getAll', filters: { searchText, status } });
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
