import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { Formacion } from '../models/formacion.model';
import { KeyValue } from '../models/keyValue.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FormacionesService extends BaseCrud<Formacion> {

    public readonly API_URL = `${environment.apiUrl}/formaciones`;

    // ── Estado reactivo ──────────────────────────────────────────────────────
    private readonly _formaciones = signal<Formacion[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly formaciones = this._formaciones.asReadonly();
    readonly totalActivos = signal(0);
    readonly totalInactivos = signal(0);
    readonly total = signal(0);

    readonly totalFiltered = signal(0);

    // ── Carga inicial ────────────────────────────────────────────────────────
    loadAll(searchText = '', filterType = 'todos', page = 1, pageSize = 10): Observable<Formacion[]> {
        this.loading.set(true);
        this.error.set(null);

        let activo: boolean | undefined = undefined;
        if (filterType === 'activos') activo = true;
        if (filterType === 'baja') activo = false;

        return this._findAll({ action: 'getFormaciones', filters: { searchText, activo }, page, pageSize }).pipe(
            tap({
                next: list => {
                    this._formaciones.set(list);
                    if (list && list.length > 0) {
                        const first = list[0] as any;
                        this.totalFiltered.set(Number(first.total_records) || list.length);
                        this.total.set(Number(first.total_global) || 0);
                        this.totalActivos.set(Number(first.total_activos) || 0);
                        this.totalInactivos.set(Number(first.total_inactivos) || 0);
                    } else {
                        this.totalFiltered.set(0);
                    }
                    this.loading.set(false);
                },
                error: e => { this.error.set(e?.message ?? 'Error al cargar'); this.loading.set(false); },
            })
        );
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────
    add(data: Omit<Formacion, 'id'>): Observable<Formacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._create({ action: 'createFormacion', formacionData: data }).pipe(
            tap({
                next: created => { this._formaciones.update(list => [created, ...list]); this.loading.set(false); },
                error: e => { this.error.set(e?.message ?? 'Error al crear'); this.loading.set(false); },
            })
        );
    }

    update(id: number, data: Omit<Formacion, 'id'>): Observable<Formacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateFormacion', formacionId: id, formacionData: data }).pipe(
            tap({
                next: updated => { this._formaciones.update(list => list.map(c => c.id === id ? { ...c, ...updated } : c)); this.loading.set(false); },
                error: e => { this.error.set(e?.message ?? 'Error al actualizar'); this.loading.set(false); },
            })
        );
    }

    toggleActivo(id: number): Observable<Formacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._toggleStatus({ action: 'toggleFormacionStatus', formacionId: id }).pipe(
            tap({
                next: updated => { this._formaciones.update(list => list.map(c => c.id === id ? { ...c, ...updated } : c)); this.loading.set(false); },
                error: e => { this.error.set(e?.message ?? 'Error al cambiar estado'); this.loading.set(false); },
            })
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    getById(id: number): Formacion | undefined {
        return this._formaciones().find(c => c.id === id);
    }

    title(c: Formacion): string {
        return c.curso || 'Sin título';
    }

    initials(c: Formacion): string {
        return (c.curso ? c.curso.substring(0, 2) : 'FO').toUpperCase();
    }

    colorFor(id: number): string {
        const COLORS = [
            'linear-gradient(135deg,#5a4d9a,#476fab)',
            'linear-gradient(135deg,#476fab,#23b4cd)',
            'linear-gradient(135deg,#3198bf,#23b4cd)',
            'linear-gradient(135deg,#55569e,#3198bf)',
            'linear-gradient(135deg,#5a4d9a,#23b4cd)',
        ];
        return COLORS[(id - 1) % COLORS.length];
    }

    // ── Lookups ──────────────────────────────────────────────────────────────
    findAreas(): Observable<KeyValue[]> {
        return this.trackRequest(this.http.post<{ data: KeyValue[] }>(this.API_URL, { action: 'getArea' }))
            .pipe(map(res => res.data));
    }

    findModalidades(): Observable<KeyValue[]> {
        return this.trackRequest(this.http.post<{ data: KeyValue[] }>(this.API_URL, { action: 'getModalidad' }))
            .pipe(map(res => res.data));
    }

    findEjecuciones(): Observable<KeyValue[]> {
        return this.trackRequest(this.http.post<{ data: KeyValue[] }>(this.API_URL, { action: 'getEjecucion' }))
            .pipe(map(res => res.data));
    }
}
