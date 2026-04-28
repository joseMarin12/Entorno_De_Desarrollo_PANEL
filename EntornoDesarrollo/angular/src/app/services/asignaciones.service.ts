import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { Asignacion } from '../models/asignacion.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AsignacionesService extends BaseCrud<Asignacion> {

    public readonly API_URL = `${environment.apiUrl}/asignaciones`;

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
    loadAll(searchText = '', filterType = 'todos', page = 1, pageSize = 10): Observable<Asignacion[]> {
        this.loading.set(true);
        this.error.set(null);
        
        let activo: boolean | undefined = undefined;
        if (filterType === 'activos') activo = true;
        if (filterType === 'baja') activo = false;

        return this._findAll({ action: 'getAsignaciones', filters: { searchText, activo }, page, pageSize }).pipe(
            tap({
                next: list => {
                    this._asignaciones.set(list);
                    if (list && list.length > 0) {
                        const first = list[0] as any;
                        this.totalFiltered.set(Number(first.total_records) || list.length);
                        this.total.set(Number(first.total_global) || 0);
                        this.totalActivos.set(Number(first.total_activos) || 0);
                        this.totalInactivos.set(Number(first.total_inactivos) || 0);
                    } else {
                        this.totalFiltered.set(0);
                        // Cuando la lista de búsqueda está vacía, no queremos poner los globales a 0 si hay datos.
                        // Sin embargo, si la DB está vacía, será 0. Si simplemente no hay resultados de búsqueda,
                        // la query anterior no nos da los totales globales porque no hay registros.
                        // Para solucionarlo de forma sencilla, si total_global venía, lo usamos, si no, lo dejamos igual.
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
                next: created => { this._asignaciones.update(list => [created, ...list]); this.loading.set(false); },
                error: e => { this.error.set(e?.message ?? 'Error al crear'); this.loading.set(false); },
            })
        );
    }

    update(id: number, data: Omit<Asignacion, 'id'>): Observable<Asignacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateAsignacion', asignacionId: id, asignacionData: data }).pipe(
            tap({
                next: updated => { this._asignaciones.update(list => list.map(c => c.id === id ? { ...c, ...updated } : c)); this.loading.set(false); },
                error: e => { this.error.set(e?.message ?? 'Error al actualizar'); this.loading.set(false); },
            })
        );
    }

    toggleActivo(id: number): Observable<Asignacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._toggleStatus({ action: 'toggleAsignacionStatus', asignacionId: id }).pipe(
            tap({
                next: updated => { this._asignaciones.update(list => list.map(c => c.id === id ? { ...c, ...updated } : c)); this.loading.set(false); },
                error: e => { this.error.set(e?.message ?? 'Error al cambiar estado'); this.loading.set(false); },
            })
        );
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
