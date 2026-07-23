import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Empresa } from '../models/empresa.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';
import { TipoEmpresa } from '../models/tipo-empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresasApiService extends BaseCrud<Empresa> {
  
  // Apunta al prefijo /api del proxy de Laravel en producción
  public override readonly API_URL = `${environment.apiUrl}/api/empresas`;

  findAll(searchText = '', status = '', tipo = '', page = 1, limit = 10): Observable<{ data: Empresa[], total: number, totalActivos: number, totalInactivos: number }> {
    return this.http.post<{ data: Empresa[], total: number, totalActivos: number, totalInactivos: number }>(this.API_URL, {
      action: 'getEmpresas',
      filters: { searchText, status, tipo },
      page,
      limit,
    });
  }

  findTipos(): Observable<TipoEmpresa[]> {
    return this.http.post<{ data: TipoEmpresa[] }>(this.API_URL, { action: 'getTiposEmpresa' })
      .pipe(
        // Navegación segura para evitar errores en consola si la API responde null
        map(res => res?.data ?? [])
      );
  }

  create(data: Empresa): Observable<Empresa> {
    return this._create({ action: 'createEmpresa', empresaData: data });
  }

  update(id: number, data: Empresa): Observable<Empresa> {
    return this._update({ 
      action: 'updateEmpresa', 
      empresaId: id, 
      empresaData: {
        nombre: data.nombre,
        razonSocial: data.razonSocial,
        cif: data.cif,
        id_tipo_empresa: data.id_tipo_empresa,
        id_comerciales: data.id_comerciales,
        activo: data.activo,
      } 
    });
  }

  toggleStatus(id: number): Observable<Empresa> {
    return this._toggleStatus({ action: 'toggleEmpresaStatus', empresaId: id });
  }
}
