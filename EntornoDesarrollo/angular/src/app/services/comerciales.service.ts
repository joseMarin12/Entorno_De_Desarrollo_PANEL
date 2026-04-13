import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Comercial } from '../models/comercial.model';

// ── URL base del proxy Laravel ───────────────────────────────────────────────
const API_URL = 'http://localhost:8000/api/comerciales';

@Injectable({ providedIn: 'root' })
export class ComercialesService {

  private http = inject(HttpClient);

  // ── Estado reactivo ──────────────────────────────────────────────────────
  private _comerciales = signal<Comercial[]>([]);
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);

  // ── Vistas derivadas (computed) ──────────────────────────────────────────
  readonly comerciales    = this._comerciales.asReadonly();
  readonly totalActivos   = computed(() => this._comerciales().filter(c => c.activo).length);
  readonly totalInactivos = computed(() => this._comerciales().filter(c => !c.activo).length);
  readonly total          = computed(() => this._comerciales().length);

  // ── Carga inicial ────────────────────────────────────────────────────────

  /**
   * Llama a n8n (vía Laravel) para obtener todos los comerciales.
   * Body: { action: 'getComerciales', filters: { searchText: '', status: '' } }
   */
  async loadAll(searchText = '', status = ''): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Comercial[] }>(API_URL, {
          action: 'getComerciales',
          filters: { searchText, status },
        })
      );
      this._comerciales.set(res.data ?? []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cargar los comerciales');
    } finally {
      this.loading.set(false);
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo comercial.
   * Body: { action: 'createComercial', comercialData: { nombre, primer_apellido, ... } }
   */
  async add(data: Omit<Comercial, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Comercial }>(API_URL, {
          action: 'createComercial',
          comercialData: data,
        })
      );
      // Añadir el nuevo registro (con id real de la BD) al principio de la lista
      this._comerciales.update(list => [res.data, ...list]);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al crear el comercial');
      throw e; // re-lanzar para que el componente pueda mostrar el toast de error
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Actualiza un comercial existente.
   * Body: { action: 'updateComercial', comercialId: id, comercialData: { ... } }
   */
  async update(id: number, data: Omit<Comercial, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Comercial }>(API_URL, {
          action: 'updateComercial',
          comercialId: id,
          comercialData: data,
        })
      );
      // Reemplazar el registro en el signal con la respuesta real de la BD
      this._comerciales.update(list =>
        list.map(c => (c.id === id ? res.data : c))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al actualizar el comercial');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Activa o desactiva un comercial (toggle).
   * Body: { action: 'toggleComercialStatus', comercialId: id }
   */
  async toggleActivo(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Comercial }>(API_URL, {
          action: 'toggleComercialStatus',
          comercialId: id,
        })
      );
      // Actualizar el signal con el estado real devuelto por la BD
      this._comerciales.update(list =>
        list.map(c => (c.id === id ? res.data : c))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cambiar el estado del comercial');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getById(id: number): Comercial | undefined {
    return this._comerciales().find(c => c.id === id);
  }

  fullName(c: Comercial): string {
    return [c.nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean).join(' ');
  }

  initials(c: Comercial): string {
    return (c.nombre[0] + c.primer_apellido[0]).toUpperCase();
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
