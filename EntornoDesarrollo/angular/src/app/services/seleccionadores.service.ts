import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Seleccionador } from '../models/seleccionador.model';
import { firstValueFrom } from 'rxjs';

// ── URL base del proxy Laravel ───────────────────────────────────────────────
const API_URL = 'http://localhost:8000/api/seleccionadores';

@Injectable({ providedIn: 'root' })
export class SeleccionadoresService {
  private http = inject(HttpClient);

  // ── Estado reactivo ──────────────────────────────────────────────────────
  private _seleccionadores = signal<Seleccionador[]>([]);
  private _empresas = signal<{id: number, nombre: string}[]>([]);
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);

  // Vistas derivadas (computed)
  readonly seleccionadores = this._seleccionadores.asReadonly();
  readonly empresasDisponibles = this._empresas.asReadonly();
  readonly total           = computed(() => this._seleccionadores().length);
  readonly activos         = computed(() => this._seleccionadores().filter(s => s && s.activo).length);
  readonly inactivos       = computed(() => this._seleccionadores().filter(s => s && !s.activo).length);
  readonly externos        = computed(() => this._seleccionadores().filter(s => s && s.tipo === 'externo').length);

  constructor() {
    this.loadAll();
    this.loadEmpresas();
  }

  // ── Carga inicial ────────────────────────────────────────────────────────

  /**
   * Obtiene todos los seleccionadores vía n8n.
   */
  async loadAll(searchText = '', status = ''): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Seleccionador[] }>(API_URL, {
          action: 'getSeleccionadores',
          filters: { searchText, status },
        })
      );
      // Blindaje: nos aseguramos de que siempre sea un array
      const rawData = res?.data;
      this._seleccionadores.set(Array.isArray(rawData) ? rawData : []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cargar los seleccionadores');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtiene las empresas reales desde la base de datos vía n8n.
   */
  async loadEmpresas(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: {id: number, nombre: string}[] }>(API_URL, {
          action: 'getEmpresas'
        })
      );
      this._empresas.set(res.data ?? []);
    } catch (e) {
      console.warn('⚠️ No se pudieron cargar las empresas reales:', e);
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo seleccionador.
   */
  async add(data: Omit<Seleccionador, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Limpiamos los datos: convertimos undefined en null y normalizamos el campo 'tipo'
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, val]) => {
          let value = val === undefined ? null : val;
          // Normalizamos el tipo para evitar fallos de Check Constraint en Postgres
          if (key === 'tipo' && typeof value === 'string') {
            value = value.toLowerCase().trim();
          }
          return [key, value];
        })
      );

      console.log('🚀 Enviando a n8n [CREATE]:', cleanData);

      const res = await firstValueFrom(
        this.http.post<{ data: Seleccionador }>(API_URL, {
          action: 'createSeleccionador',
          seleccionadorData: cleanData,
        })
      );
      console.log('✅ Respuesta de n8n [CREATE OK]:', res);
      // Aseguramos que tomamos el objeto si viene en un array
      const rawItem = res?.data;
      const newItem = Array.isArray(rawItem) ? rawItem[0] : rawItem;
      
      if (newItem && typeof newItem === 'object') {
        this._seleccionadores.update(list => [newItem, ...(Array.isArray(list) ? list : [])]);
      }
    } catch (e: any) {
      console.error('❌ ERROR CRÍTICO al crear seleccionador:', e);
      this.error.set(e?.message ?? 'Error al crear el seleccionador');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Actualiza un seleccionador existente.
   */
  async update(id: number, data: Partial<Seleccionador>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Limpiamos los datos: convertimos undefined en null para compatibilidad total con n8n
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, val]) => [key, val === undefined ? null : val])
      );

      const res = await firstValueFrom(
        this.http.post<{ data: Seleccionador }>(API_URL, {
          action: 'updateSeleccionador',
          seleccionadorId: id,
          seleccionadorData: cleanData,
        })
      );
      // Capturamos el objeto correctamente aunque n8n lo envíe en un array
      const updatedItem = Array.isArray(res.data) ? res.data[0] : res.data;
      this._seleccionadores.update(list =>
        list.map(s => (s.id === id ? updatedItem : s))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al actualizar el seleccionador');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cambia el estado de alta/baja.
   */
  async toggleActivo(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<{ data: Seleccionador }>(API_URL, {
          action: 'toggleSeleccionadorStatus',
          seleccionadorId: id,
        })
      );
      // Capturamos el objeto correctamente aunque n8n lo envíe en un array
      const updatedItem = Array.isArray(res.data) ? res.data[0] : res.data;
      this._seleccionadores.update(list =>
        list.map(s => (s.id === id ? updatedItem : s))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cambiar el estado');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getById(id: number): Seleccionador | undefined {
    return this._seleccionadores().find(s => s.id === id);
  }

  fullName(s: Seleccionador): string {
    return [s.nombre, s.primer_apellido, s.segundo_apellido].filter(Boolean).join(' ');
  }

  initials(s: Seleccionador): string {
    return ((s.nombre?.[0] ?? '') + (s.primer_apellido?.[0] ?? '')).toUpperCase();
  }

  colorFor(id: number): string {
    const COLORS = [
      'linear-gradient(135deg,#5a4d9a,#3198bf)',
      'linear-gradient(135deg,#3198bf,#23b4cd)',
      'linear-gradient(135deg,#476fab,#3198bf)',
      'linear-gradient(135deg,#55569e,#476fab)',
      'linear-gradient(135deg,#23b4cd,#3198bf)',
      'linear-gradient(135deg,#5a4d9a,#476fab)',
    ];
    return COLORS[id % COLORS.length];
  }
}
