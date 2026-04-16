import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Formacion } from '../models/formacion.model'; // Asegúrate de tener la ruta correcta a tu modelo
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FormacionesApiService extends BaseCrud<Formacion> {
    protected readonly API_URL = `${environment.apiUrl}/formaciones`;

    findAll(searchText = '', status = ''): Observable<Formacion[]> {
        return this._findAll({ action: 'getAll', filters: { searchText, status } });
    }

    create(data: Formacion): Observable<Formacion> {
        return this._create({ action: 'create', formacionData: data });
    }

    update(id: number, data: Formacion): Observable<Formacion> {
        return this._update({ action: 'update', formacionId: id, formacionData: data });
    }

    toggleStatus(id: number): Observable<Formacion> {
        return this._toggleStatus({ action: 'toggleStatus', formacionId: id });
    }
}