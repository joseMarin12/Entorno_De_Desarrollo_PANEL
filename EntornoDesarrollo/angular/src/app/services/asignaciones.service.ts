import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { Asignacion } from '../models/asignacion.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AsignacionesService extends BaseCrud<Asignacion> {

    // 🟢 CORREGIDO: Inclusión de /api/ para coincidir con las rutas de Laravel Proxy
    public override readonly API_URL = `${environment.apiUrl}/api/asignaciones`;

    // ── Estado reactivo ──────────────────────────────────────────────────────
    private _asignaciones = signal<Asignacion[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly asignaciones = this._asignaciones.asReadonly();
    readonly total = signal(0);
    readonly totalActivos = signal(0);
    readonly totalInactivos = signal(0);
    readonly totalFiltered = signal(0);

    // ── Carga inicial ────────────────────────────────────────────────────────
    loadAll(searchText = '', searchField = '', filterType = 'todos', page = 1, pageSize = 10): Observable<Asignacion[]> {
        this.loading.set(true);
        this.error.set(null);

        let activo: boolean | undefined = undefined;
        if (filterType === 'activos') activo = true;
        if (filterType === 'baja') activo = false;

        return this._findAll({ action: 'getAsignaciones', filters: { searchText, searchField, activo }, page, pageSize }).pipe(
            tap({
                next: list => {
                    const rows = (list ?? []) as any[];
                    if (rows.length === 0) {
                        // Sin datos ni fila-resumen: reseteamos todo
                        this._asignaciones.set([]);
                        this.totalFiltered.set(0);
                        this.total.set(0);
                        this.totalActivos.set(0);
                        this.totalInactivos.set(0);
                    } else {
                        // Las estadísticas globales viajan en la primera fila devuelta por n8n
                        const first = rows[0];
                        this.total.set(Number(first.total_global) || 0);
                        this.totalActivos.set(Number(first.total_activos) || 0);
                        this.totalInactivos.set(Number(first.total_inactivos) || 0);
                        this.totalFiltered.set(Number(first.total_records) || 0);
                        this._asignaciones.set(rows.filter(r => r.id !== null && r.id !== undefined));
                    }
                    this.loading.set(false);
                },
                error: e => { this.error.set(e?.message ?? 'Error al cargar'); this.loading.set(false); },
            })
        );
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────
    add(data: Omit<Asignacion, 'id'>): Observable<Asignacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._create({ action: 'createAsignacion', asignacionData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al crear'); this.loading.set(false); },
            })
        );
    }

    update(id: number, data: Omit<Asignacion, 'id'>): Observable<Asignacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateAsignacion', asignacionId: id, asignacionData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al actualizar'); this.loading.set(false); },
            })
        );
    }

    toggleActivo(id: number): Observable<Asignacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._toggleStatus({ action: 'toggleAsignacionStatus', asignacionId: id }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al cambiar estado'); this.loading.set(false); },
            })
        );
    }

    // ── Lookups (Conservados para desplegables de formularios) ──────────────
    getEmpresasLookup(): Observable<{ id: number; nombre_empresa: string }[]> {
        return this._findAll({ action: 'getEmpresas' }) as unknown as Observable<{ id: number; nombre_empresa: string }[]>;
    }

    getTrabajadoresLookup(): Observable<{ id: number; nombre_completo: string }[]> {
        return this._findAll({ action: 'getTrabajadores' }) as unknown as Observable<{ id: number; nombre_completo: string }[]>;
    }

    getComercialesLookup(): Observable<{ id: number; nombre_completo: string }[]> {
        return this._findAll({ action: 'getComerciales' }) as unknown as Observable<{ id: number; nombre_completo: string }[]>;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    getById(id: number): Asignacion | undefined {
        return this._asignaciones().find(c => c.id === id);
    }

    title(c: Asignacion): string {
        return `Asignación #${c.id}`;
    }

    initials(c: Asignacion): string {
        return `A${c.id}`;
    }

    colorFor(id: number): string {
        const COLORS = [
            'linear-gradient(135deg,#5a4d9a,#476fab)',
            'linear-gradient(135deg,#476fab,#23b4cd)',
            'linear-gradient(135deg,#3198bf,#23b4cd)',
            'linear-gradient(135deg,#55569e,#3198bf)',
            'linear-gradient(135deg,#5a4d9a,#23b4cd)',
        ];
        return COLORS[(id - 1) % COLORS.length] || COLORS[0];
    }
}
