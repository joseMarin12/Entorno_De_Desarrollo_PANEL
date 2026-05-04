import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoEmpresa } from '../../models/tipo-empresa.model';
import { EmpresasApiService } from '../empresas-api.service';
import { BaseStore } from './base.store';

@Injectable({ providedIn: 'root' })
export class TipoEmpresaStore extends BaseStore<TipoEmpresa> {
  private readonly empresasApi = inject(EmpresasApiService);

  readonly tipos = this.items;
  readonly hasTipos = this.hasItems;

  protected fetch(): Observable<TipoEmpresa[]> {
    return this.empresasApi.findTipos();
  }
}
