import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ContactoEmpresa } from '../models/contacto-empresa.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactosEmpresasApiService {
  private readonly API_URL = `${environment.apiUrl}/contactos-empresas`;
  constructor(private http: HttpClient) {}

  findAll(idEmpresa: number, filters: { searchText?: string; status?: string } = {}, page = 1, limit = 10):
    Observable<{ data: ContactoEmpresa[]; total: number; totalActivos: number; totalInactivos: number }> {
    return this.http.post<{ data: ContactoEmpresa[]; total: number; totalActivos: number; totalInactivos: number }>(
      this.API_URL, { action: 'getContactos', idEmpresa, filters, page, limit }
    );
  }

  create(data: Omit<ContactoEmpresa, 'id' | 'created_at'>): Observable<{ data: ContactoEmpresa[] }> {
    return this.http.post<{ data: ContactoEmpresa[] }>(this.API_URL, { action: 'createContacto', contactoData: data });
  }

  update(id: number, data: Omit<ContactoEmpresa, 'id' | 'created_at'>): Observable<{ data: ContactoEmpresa[] }> {
    return this.http.post<{ data: ContactoEmpresa[] }>(this.API_URL, { action: 'updateContacto', contactoId: id, contactoData: data });
  }

  toggleStatus(id: number): Observable<{ data: ContactoEmpresa[] }> {
    return this.http.post<{ data: ContactoEmpresa[] }>(this.API_URL, { action: 'toggleContactoStatus', contactoId: id });
  }
}
