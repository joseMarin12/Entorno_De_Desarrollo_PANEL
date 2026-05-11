import { Injectable } from "@angular/core";
import { DireccionEmpresa } from "../models/direccion-empresa.model";
import { BaseCrud } from "./base.service";
import { environment } from "../../environments/environment";
import { map, Observable } from "rxjs";
import { Pais } from "../models/pais.model";
import { Provincia } from "../models/provincia.model";
import { Localidad } from "../models/localidad.model";

@Injectable({ providedIn: 'root' })
export class DireccionesEmpresasApiService extends BaseCrud<DireccionEmpresa> {
    protected readonly API_URL = `${environment.apiUrl}/direcciones-empresas`;

     findAll(searchText = '', status = '', pais = '', page = 1, limit = 10, idEmpresa: number): Observable<{ data: DireccionEmpresa[], total: number, totalActivos: number, totalInactivos: number }> {
        return this.http.post<{ data: DireccionEmpresa[], total: number, totalActivos: number, totalInactivos: number }>(this.API_URL, {
            action: 'getDirecciones',
            idEmpresa: idEmpresa,
            filters: {searchText, status, pais },
            page,
            limit,
        });
    }

    findPaises(): Observable<Pais[]> {
        return this.http.post<{ data: Pais[] }>(this.API_URL, { action: 'getPaises' })
            .pipe(map(res => res.data));
    }

    findProvincias(idPais: number): Observable<Provincia[]> {
        return this.http.post<{ data: Provincia[] }>(this.API_URL, { action: 'getProvincias', idPais })
            .pipe(map(res => res.data));
    }

    findLocalidades(idProvincia: number): Observable<Localidad[]> {
        return this.http.post<{ data: Localidad[] }>(this.API_URL, { action: 'getLocalidades', idProvincia })
            .pipe(map(res => res.data));
    }

    create(data: Omit<DireccionEmpresa, 'id' | 'localidad' | 'provincia' | 'pais'>): Observable<DireccionEmpresa> {
        return this._create({ action: 'createDireccion', direccionData: data });
    }

    update(id: number, data: Omit<DireccionEmpresa, 'id' | 'localidad' | 'provincia' | 'pais'>): Observable<DireccionEmpresa> {
        return this._update({ action: 'updateDireccion', direccionId: id, direccionData: data });
    }

    toggleStatus(id: number): Observable<DireccionEmpresa> {
        return this._toggleStatus({ action: 'toggleDireccionStatus', direccionId: id });
    }
}    