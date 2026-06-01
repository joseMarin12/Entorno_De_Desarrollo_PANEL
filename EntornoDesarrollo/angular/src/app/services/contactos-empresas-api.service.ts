import { Injectable } from "@angular/core";
import { ContactosEmpresa } from "../models/contactos-empresa.model";
import { BaseCrud } from "./base.service";
import { environment } from "../../environments/environment";
import { map, Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ContactosEmpresasApiService extends BaseCrud<ContactosEmpresa> {
    protected readonly API_URL = `${environment.apiUrl}/contactos-empresas`;

    findAll(searchText = '', status = '', cargo = '', page = 1, limit = 10, idEmpresa: number): Observable<{ data: ContactosEmpresa[], total: number, totalActivos: number, totalInactivos: number }> {
        return this.http.post<{ data: ContactosEmpresa[], total: number, totalActivos: number, totalInactivos: number }>(this.API_URL, {
            action: 'getContactos',
            idEmpresa: idEmpresa,
            filters: {searchText, status, cargo },
            page,
            limit,
        });
    }

    findCargos(): Observable<string[]> {
        return this.http.post<{ data: string[] }>(this.API_URL, { action: 'getCargos' })
            .pipe(map(res => res.data));
    }

    create(data: Omit<ContactosEmpresa, 'id'>): Observable<ContactosEmpresa> {
        return this._create({ action: 'createContacto', contactoData: data });
    }
    
    update(id: number, data: Omit<ContactosEmpresa, 'id'>): Observable<ContactosEmpresa> {
        return this._update({ action: 'updateContacto', contactoId: id, contactoData: data });
    }

    toggleStatus(id: number): Observable<ContactosEmpresa> {
        return this._toggleStatus({ action: 'toggleContactoStatus', contactoId: id });
    }
}