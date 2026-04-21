import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Empresa } from '../models/empresa.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';
import { TipoEmpresa } from '../models/tipo-empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresasApiService extends BaseCrud<Empresa> {
  protected readonly API_URL = `${environment.apiUrl}/empresas`;

  findAll(searchText = '', status = ''): Observable<Empresa[]> {
    return this._findAll({ action: 'getEmpresas', filters: { searchText, status } });
  }

  findTipos(): Observable<TipoEmpresa[]> {
    return this.http.post<{ data: TipoEmpresa[] }>(this.API_URL, { action: 'getTiposEmpresa' })
      .pipe(map(res => res.data));
  }

  create(data: Empresa): Observable<Empresa> {
    return this._create({ action: 'createEmpresa', empresaData: data });
  }

  update(id: number, data: Empresa): Observable<Empresa> {
    return this._update({ action: 'updateEmpresa', empresaId: id, empresaData: data });
  }

  toggleStatus(id: number): Observable<Empresa> {
    return this._toggleStatus({ action: 'toggleEmpresaStatus', empresaId: id });
  }
}
