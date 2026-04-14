import { Injectable, signal, computed, inject } from '@angular/core';
import { Empresa } from '../models/empresa.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

// ── URL base del proxy Laravel ───────────────────────────────────────────────
const API_URL = 'http://localhost:8000/api/empresas';

@Injectable({ providedIn: 'root' })
export class EmpresasService {

  private http = inject(HttpClient);

  // ── Estado reactivo ──────────────────────────────────────────────────────
  private _empresas = signal<Empresa[]>([]);
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);

  // ── Vistas derivadas (computed) ──────────────────────────────────────────
  readonly empresas    = this._empresas.asReadonly();
  readonly totalActivos   = computed(() => this._empresas().filter(e => e.activo).length);
  readonly totalInactivos = computed(() => this._empresas().filter(e => !e.activo).length);
  readonly total          = computed(() => this._empresas().length);

  // ── Carga inicial ────────────────────────────────────────────────────────

  /**
   * Llama a n8n (vía Laravel) para obtener todas las empresas.
   * Body: { action: 'getEmpresas', filters: { searchText: '', status: '' } }
   */
  async loadAll(searchText = '', status = ''): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Empresa[] }>(API_URL, {
          action: 'getEmpresas',
          filters: { searchText, status },
        })
      );
      this._empresas.set(res.data ?? []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cargar las empresas');
    } finally {
      this.loading.set(false);
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Crea una nueva empresa.
   * Body: { action: 'createEmpresa', empresaData: { nombre, razonSocial, ... } }
   */
  async add(data: Omit<Empresa, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Empresa }>(API_URL, {
          action: 'createEmpresa',
          empresaData: data,
        })
      );
      // Añadir el nuevo registro (con id real de la BD) al principio de la lista
      this._empresas.update(list => [res.data, ...list]);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al crear la empresa');
      throw e; // re-lanzar para que el componente pueda mostrar el toast de error
    } finally {
      this.loading.set(false);
    }
  }

   /**
    * Actualiza una empresa existente.
    * Body: { action: 'updateEmpresa', empresaId: id, empresaData: { ... } }
    */
   async update(id: number, data: Omit<Empresa, 'id'>): Promise<void> {
     this.loading.set(true);
     this.error.set(null);
     try {
       const res = await firstValueFrom(
         this.http.post<{ data: Empresa }>(API_URL, {
           action: 'updateEmpresa',
           empresaId: id,
           empresaData: data,
         })
       );
       // Reemplazar el registro en el signal con la respuesta real de la BD
       this._empresas.update(list =>
         list.map(e => (e.id === id ? res.data : e))
       );
     } catch (e: any) {
       this.error.set(e?.message ?? 'Error al actualizar la empresa');
       throw e;
     } finally {
       this.loading.set(false);
     }
   }
   
  /**
   * Activa o desactiva una empresa (toggle).
   * Body: { action: 'toggleEmpresaStatus', empresaId: id }
   */
  async toggleActivo(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Empresa }>(API_URL, {
          action: 'toggleEmpresaStatus',
          empresaId: id,
        })
      );
      // Actualizar el signal con el estado real devuelto por la BD
      this._empresas.update(list =>
        list.map(e => (e.id === id ? res.data : e))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cambiar el estado de la empresa');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }   

  // ── Helpers ──────────────────────────────────────────────────────────────

  getById(id: number): Empresa | undefined {
    return this._empresas().find(e => e.id === id);
  }

  fullName(e: Empresa): string {
    return [e.nombre, e.razonSocial].filter(Boolean).join(' ');
  }

  initials(e: Empresa): string {
    return (e.nombre[0] + e.razonSocial[0]).toUpperCase();
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
