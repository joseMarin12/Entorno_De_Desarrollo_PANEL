import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Formacion } from '../models/formacion.model';

// ── URL base del proxy Laravel ───────────────────────────────────────────────
const API_URL = 'http://localhost:8000/api/formaciones';

@Injectable({ providedIn: 'root' })
export class FormacionesService {

    private http = inject(HttpClient);

    // ── Estado reactivo ──────────────────────────────────────────────────────
    private _formaciones = signal<Formacion[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    // ── Vistas derivadas (computed) ──────────────────────────────────────────
    readonly formaciones = this._formaciones.asReadonly();
    readonly totalActivos = computed(() => this._formaciones().filter(c => c.id_estado === 1).length);
    readonly totalInactivos = computed(() => this._formaciones().filter(c => c.id_estado !== 1).length);
    readonly total = computed(() => this._formaciones().length);

    // ── Carga inicial ────────────────────────────────────────────────────────

    /**
     * Llama a n8n (vía Laravel) para obtener todas las formaciones.
     */
    async loadAll(searchText = '', status = ''): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const res = await firstValueFrom(
                this.http.post<{ data: Formacion[] }>(API_URL, {
                    action: 'getFormaciones',
                    filters: { searchText, status },
                })
            );
            this._formaciones.set(res.data ?? []);
        } catch (e: any) {
            this.error.set(e?.message ?? 'Error al cargar las formaciones');
        } finally {
            this.loading.set(false);
        }
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    /**
     * Crea una nueva formación.
     */
    async add(data: Omit<Formacion, 'id'>): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const res = await firstValueFrom(
                this.http.post<{ data: Formacion }>(API_URL, {
                    action: 'createFormacion',
                    formacionData: data,
                })
            );
            this._formaciones.update(list => [res.data, ...list]);
        } catch (e: any) {
            this.error.set(e?.message ?? 'Error al crear la formación');
            throw e; 
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Actualiza una formación existente.
     */
    async update(id: number, data: Omit<Formacion, 'id'>): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const res = await firstValueFrom(
                this.http.post<{ data: Formacion }>(API_URL, {
                    action: 'updateFormacion',
                    formacionId: id,
                    formacionData: data,
                })
            );
            this._formaciones.update(list =>
                list.map(c => (c.id === id ? res.data : c))
            );
        } catch (e: any) {
            this.error.set(e?.message ?? 'Error al actualizar la formación');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Activa o desactiva una formación (toggle).
     */
    async toggleActivo(id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const res = await firstValueFrom(
                this.http.post<{ data: Formacion }>(API_URL, {
                    action: 'toggleFormacionStatus',
                    formacionId: id,
                })
            );
            this._formaciones.update(list =>
                list.map(c => (c.id === id ? res.data : c))
            );
        } catch (e: any) {
            this.error.set(e?.message ?? 'Error al cambiar el estado de la formación');
            throw e;
        } finally {
            this.loading.set(false);
        }
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
