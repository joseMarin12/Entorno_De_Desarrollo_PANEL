import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { Formacion } from '../models/formacion.model';

@Injectable({ providedIn: 'root' })
export class FormacionesService extends BaseCrud<Formacion> {

    protected readonly API_URL = 'http://localhost:8000/api/formaciones';

    // ── Estado reactivo ──────────────────────────────────────────────────────
    private _formaciones = signal<Formacion[]>([]);
    readonly loading     = signal(false);
    readonly error       = signal<string | null>(null);

    readonly formaciones    = this._formaciones.asReadonly();
    readonly totalActivos   = computed(() => this._formaciones().filter(c => c.activo === true).length);
    readonly totalInactivos = computed(() => this._formaciones().filter(c => c.activo === false).length);
    readonly total          = computed(() => this._formaciones().length);

    // ── Carga inicial ────────────────────────────────────────────────────────
    loadAll(searchText = '', status = ''): Observable<Formacion[]> {
        this.loading.set(true);
        this.error.set(null);
        return this._findAll({ action: 'getFormaciones', filters: { searchText, status } }).pipe(
            tap({
                next:     list => { this._formaciones.set(list); this.loading.set(false); },
                error:    e    => { this.error.set(e?.message ?? 'Error al cargar'); this.loading.set(false); },
            })
        );
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────
    add(data: Omit<Formacion, 'id'>): Observable<Formacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._create({ action: 'createFormacion', formacionData: data }).pipe(
            tap({
                next:  created => { this._formaciones.update(list => [created, ...list]); this.loading.set(false); },
                error: e       => { this.error.set(e?.message ?? 'Error al crear'); this.loading.set(false); },
            })
        );
    }

    update(id: number, data: Omit<Formacion, 'id'>): Observable<Formacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateFormacion', formacionId: id, formacionData: data }).pipe(
            tap({
                next:  updated => { this._formaciones.update(list => list.map(c => c.id === id ? { ...c, ...updated } : c)); this.loading.set(false); },
                error: e       => { this.error.set(e?.message ?? 'Error al actualizar'); this.loading.set(false); },
            })
        );
    }

    toggleActivo(id: number): Observable<Formacion> {
        this.loading.set(true);
        this.error.set(null);
        return this._toggleStatus({ action: 'toggleFormacionStatus', formacionId: id }).pipe(
            tap({
                next:  updated => { this._formaciones.update(list => list.map(c => c.id === id ? { ...c, ...updated } : c)); this.loading.set(false); },
                error: e       => { this.error.set(e?.message ?? 'Error al cambiar estado'); this.loading.set(false); },
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
}