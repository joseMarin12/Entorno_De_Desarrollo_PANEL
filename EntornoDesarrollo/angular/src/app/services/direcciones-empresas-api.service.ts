iimport { Injectable, signal } from "@angular/core";
import { map, Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { BaseCrud } from "./base.service";
import { DireccionEmpresa } from "../models/direccion-empresa.model";
import { Pais } from "../models/pais.model";
import { Provincia } from "../models/provincia.model";
import { Localidad } from "../models/localidad.model";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class DireccionesEmpresasApiService extends BaseCrud<DireccionEmpresa> {

    // 🟢 Agregado el prefijo /api/ para alinearse con routes/api.php de Laravel
    protected override readonly API_URL = `${environment.apiUrl}/api/direcciones-empresas`;

    // ── Estado reactivo con Signals ─────────────────────────────────────────
    private _direcciones = signal<DireccionEmpresa[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly direcciones = this._direcciones.asReadonly();
    readonly total = signal(0);
    readonly totalActivos = signal(0);
    readonly totalInactivos = signal(0);

    // ── Consultas ────────────────────────────────────────────────────────────
    findAll(
        searchText = '', 
        status = '', 
        pais = '', 
        page = 1, 
        limit = 10, 
        idEmpresa: number
    ): Observable<{ data: DireccionEmpresa[], total: number, totalActivos: number, totalInactivos: number }> {
        this.loading.set(true);
        this.error.set(null);

        return this.http.post<{ data: DireccionEmpresa[], total: number, totalActivos: number, totalInactivos: number }>(this.API_URL, {
            action: 'getDirecciones',
            idEmpresa,
            filters: { searchText, status, pais },
            page,
            limit,
        }).pipe(
            tap({
                next: res => {
                    const list = res?.data ?? [];
                    this._direcciones.set(list);
                    this.total.set(res?.total ?? list.length);
                    this.totalActivos.set(res?.totalActivos ?? 0);
                    this.totalInactivos.set(res?.totalInactivos ?? 0);
                    this.loading.set(false);
                },
                error: e => {
                    this.error.set(e?.message ?? 'Error al cargar las direcciones');
                    this.loading.set(false);
                }
            })
        );
    }

    // ── Lookups de Ubicación ────────────────────────────────────────────────
    findPaises(): Observable<Pais[]> {
        return this.http.post<{ data: Pais[] }>(this.API_URL, { action: 'getPaises' })
            .pipe(map(res => res.data));
    }

    findProvincias(idPais: number): Observable<Provincia[]> {
        return this.http.post<{ data: Provincia[] }>(this.API_URL, { action: 'getProvincias', idPais })
            .pipe(map(res => res.data));
    }

    findLocalidades(idProvincia: number): Observable<Localidad[]> {
        return this.http.post<{ data: Localidad[] }>(this.API_URL, { action: 'getLocalidades', idProvincia })
            .pipe(map(res => res.data));
    }

    // ── Mutaciones CRUD ──────────────────────────────────────────────────────
    create(data: Omit<DireccionEmpresa, 'id' | 'localidad' | 'provincia' | 'pais'>): Observable<DireccionEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._create({ action: 'createDireccion', direccionData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al crear la dirección'); this.loading.set(false); }
            })
        );
    }

    update(id: number, data: Omit<DireccionEmpresa, 'id' | 'localidad' | 'provincia' | 'pais'>): Observable<DireccionEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._update({ action: 'updateDireccion', direccionId: id, direccionData: data }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al actualizar la dirección'); this.loading.set(false); }
            })
        );
    }

    toggleStatus(id: number): Observable<DireccionEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._toggleStatus({ action: 'toggleDireccionStatus', direccionId: id }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al cambiar estado'); this.loading.set(false); }
            })
        );
    }

    delete(id: number): Observable<DireccionEmpresa> {
        this.loading.set(true);
        this.error.set(null);
        return this._delete({ action: 'deleteDireccion', direccionId: id }).pipe(
            tap({
                next: () => this.loading.set(false),
                error: e => { this.error.set(e?.message ?? 'Error al eliminar la dirección'); this.loading.set(false); }
            })
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    getById(id: number): DireccionEmpresa | undefined {
        return this._direcciones().find(d => d.id === id);
    }

    title(d: DireccionEmpresa): string {
        return d.direccion || `Dirección #${d.id}`;
    }
}
