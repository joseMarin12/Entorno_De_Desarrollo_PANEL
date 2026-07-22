import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { ContactoEmpresa } from '../models/contacto-empresa.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactosEmpresasApiService extends BaseCrud<ContactoEmpresa> {

    protected override readonly API_URL = `${environment.apiUrl}/api/contactos-empresas`;

    // ── Estado reactivo con Signals ─────────────────────────────────────────
    private _contactos = signal<ContactoEmpresa[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly contactos = this._contactos.asReadonly();
    readonly total = signal(0);

    // ── Consultas ────────────────────────────────────────────────────────────
    findAll(idEmpresa: number, searchText = '', page = 1, limit = 100): Observable<{ data: ContactoEmpresa[], total: number }> {
        this.loading.set(true);
        this.error.set(null);

        return this.http.post<{ data: ContactoEmpresa[], total: number }>(this.API_URL, {
            action: 'getContactos',
            idEmpresa,
            filters: { searchText },
            page,
            limit,
        }).pipe(
            tap({
                next: res => {
                    const list = res?.data ?? [];
                    this._contactos.set(list);
                    this.total.set(res?.total ?? list.length);
                    this.loading.set(false);
                },
                error: e => {
                    this.error.set(e?.message ?? 'Error al cargar contactos de la empresa');
                    this.loading.set(false);
                }
            })
        );
    }

    // ── Mutaciones CRUD ──────────────────────────────────────────────────────
    create(data: Omit<ContactoEmpresa, 'id'>): Observable<ContactoEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._create({ action: 'createContacto', contactoData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al crear contacto'); this.loading.set(false); }
            })
        );
    }

    update(id: number, data: Omit<ContactoEmpresa, 'id'>): Observable<ContactoEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateContacto', contactoId: id, contactoData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al actualizar contacto'); this.loading.set(false); }
            })
        );
    }

    delete(id: number): Observable<ContactoEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._delete({ action: 'deleteContacto', contactoId: id }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al eliminar contacto'); this.loading.set(false); }
            })
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    getById(id: number): ContactoEmpresa | undefined {
        return this._contactos().find(c => c.id === id);
    }

    title(c: ContactoEmpresa): string {
        return c.nombre_completo || `Contacto #${c.id}`;
    }

    initials(c: ContactoEmpresa): string {
        if (!c.nombre_completo) return `C${c.id}`;
        return c.nombre_completo
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }
}
