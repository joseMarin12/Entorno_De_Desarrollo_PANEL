import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seleccionador } from '../models/seleccionador.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SeleccionadoresApiService extends BaseCrud<Seleccionador> {
  protected readonly API_URL = `${environment.apiUrl}/seleccionadores`;

  findAll(searchText = '', status = ''): Observable<Seleccionador[]> {
    return this._findAll({ action: 'getSeleccionadores', filters: { searchText, status } });
  }

  create(data: Omit<Seleccionador, 'id'>): Observable<Seleccionador> {
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, val]) => {
        let value = val === undefined ? null : val;
        if (key === 'tipo' && typeof value === 'string') {
          value = value.toLowerCase().trim();
        }
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
