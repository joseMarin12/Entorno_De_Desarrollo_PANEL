import { Injectable } from "@angular/core";
import { ContactoEmpresa } from "../models/contacto-empresa.model";
import { BaseCrud } from "./base.service";
import { environment } from "../../environments/environment";
import { map, Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ContactosEmpresasApiService extends BaseCrud<ContactoEmpresa> {
    protected readonly API_URL = `${environment.apiUrl}/contactos-empresas`;

    findAll(idEmpresa: number, searchText = '', page = 1, limit = 100): Observable<{ data: ContactoEmpresa[], total: number }> {
        return this.http.post<{ data: ContactoEmpresa[], total: number }>(this.API_URL, {
            action: 'getContactos',
            idEmpresa,
            filters: { searchText },
            page,
            limit,
        });
    }

    create(data: Omit<ContactoEmpresa, 'id'>): Observable<ContactoEmpresa> {
        return this._create({ action: 'createContacto', contactoData: data });
    }

    update(id: number, data: Omit<ContactoEmpresa, 'id'>): Observable<ContactoEmpresa> {
        return this._update({ action: 'updateContacto', contactoId: id, contactoData: data });
    }

    delete(id: number): Observable<ContactoEmpresa> {
        return this._delete({ action: 'deleteContacto', contactoId: id });
    }
}
