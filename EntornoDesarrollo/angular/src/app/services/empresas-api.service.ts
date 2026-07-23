import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { Empresa } from '../models/empresa.model';
import { ContactoEmpresa } from '../models/contacto-empresa.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmpresasApiService extends BaseCrud<Empresa> {

    protected override readonly API_URL = `${environment.apiUrl}/api/empresas`;

    // ── Estado reactivo con Signals ─────────────────────────────────────────
    private _empresas = signal<Empresa[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly empresas = this._empresas.asReadonly();
    readonly total = signal(0);

    // ── Consultas ────────────────────────────────────────────────────────────
    findAll(searchText = '', page = 1, limit = 100): Observable<{ data: Empresa[], total: number }> {
        this.loading.set(true);
        this.error.set(null);

        return this.http.post<{ data: Empresa[], total: number }>(this.API_URL, {
            action: 'getEmpresas',
            filters: { searchText },
            page,
            limit,
        }).pipe(
            tap({
                next: res => {
                    const list = res?.data ?? [];
                    this._empresas.set(list);
                    this.total.set(res?.total ?? list.length);
                    this.loading.set(false);
                },
                error: e => {
                    this.error.set(e?.message ?? 'Error al cargar las empresas');
                    this.loading.set(false);
                }
            })
        );
    }

    // ── Mutaciones CRUD ──────────────────────────────────────────────────────
    create(data: Omit<Empresa, 'id'>): Observable<Empresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._create({ action: 'createEmpresa', empresaData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al crear empresa'); this.loading.set(false); }
            })
        );
    }

    update(id: number, data: Omit<Empresa, 'id'>): Observable<Empresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateEmpresa', empresaId: id, empresaData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al actualizar empresa'); this.loading.set(false); }
            })
        );
    }

    delete(id: number): Observable<Empresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._delete({ action: 'deleteEmpresa', empresaId: id }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al eliminar empresa'); this.loading.set(false); }
            })
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    getById(id: number): Empresa | undefined {
        return this._empresas().find(e => e.id === id);
    }

    /**
     * Retorna el nombre legible de un contacto asociado a la empresa.
     * Línea 94 corregida con fallback seguro para la build de Angular en producción.
     */
    getContactoNombre(c: ContactoEmpresa): string {
        return c.nombre_completo || `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim() || `Contacto #${c.id}`;
    }
}
