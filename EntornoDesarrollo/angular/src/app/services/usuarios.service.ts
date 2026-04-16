import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Usuario } from '../models/usuarios.model';

const API_URL = 'http://localhost:8000/api/usuarios';

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  private http = inject(HttpClient);

  // ── Estado reactivo ──────────────────────────────────────────────────────
  private _usuarios = signal<Usuario[]>([]);
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);

  // ── Vistas derivadas (computed) ──────────────────────────────────────────
  readonly usuarios = this._usuarios.asReadonly();
  readonly total    = computed(() => this._usuarios().length);
  readonly activos  = computed(() => this._usuarios().filter(u => u.enabled).length);
  readonly inactivos= computed(() => this._usuarios().filter(u => !u.enabled).length);

  // ── Carga inicial ────────────────────────────────────────────────────────

  async loadAll(searchText = '', status = ''): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<any>(API_URL, {
          action: 'getUser',
          filters: { searchText, status },
        })
      );
      
      console.log('Respuesta cruda de n8n:', res);

      const data = this.extractData(res);
      const mapped = this.mapFromBackend(data);
      
      console.log('Usuarios mapeados:', mapped);
      this._usuarios.set(mapped);
    } catch (e: any) {
      console.error('Error cargando usuarios:', e);
      this.error.set(e?.message ?? 'Error al cargar los usuarios');
    } finally {
      this.loading.set(false);
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async add(data: Omit<Usuario, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<any>(API_URL, {
          action: 'createUser', // Coincide con n8n
          name: data.nombre,    // Mapeo plano como espera tu n8n
          surname: data.apellido1,
          email: data.email,
          enabled: data.enabled ?? true,
          password: 'password123', // Valor por defecto si no viene
          role_id: 1               // Valor por defecto para tu esquema
        })
      );
      const newUser = Array.isArray(res) ? res[0] : (res.data ?? res);
      this._usuarios.update(list => [this.mapSingleFromBackend(newUser), ...list]);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al crear el usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async update(id: number, data: Omit<Usuario, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<any>(API_URL, {
          action: 'updateUser', // Coincide con n8n
          id: id,               // n8n espera body.id
          name: data.nombre,
          surname: data.apellido1,
          email: data.email,
          enabled: data.enabled,
          role_id: 1
        })
      );
      const updated = Array.isArray(res) ? res[0] : (res.data ?? res);
      this._usuarios.update(list =>
        list.map(u => (u.id === id ? this.mapSingleFromBackend(updated) : u))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al actualizar el usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActivo(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<any>(API_URL, {
          action: 'Toogle status usuarios', // Nombre exacto que pusiste en n8n
          id: id
        })
      );
      const updated = Array.isArray(res) ? res[0] : (res.data ?? res);
      this._usuarios.update(list =>
        list.map(u => (u.id === id ? this.mapSingleFromBackend(updated) : u))
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cambiar el estado del usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Mapeadores y Extracción ──────────────────────────────────────────

  private extractData(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (!res || typeof res !== 'object') return [];

    // 1. Buscar arrays en claves comunes
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.json)) return res.json;

    // 2. Buscar si ALGUNA propiedad es un array (quedarnos con el más largo)
    const arrays = Object.values(res).filter(v => Array.isArray(v)) as any[][];
    if (arrays.length > 0) {
      return arrays.sort((a, b) => b.length - a.length)[0];
    }

    // 3. Caso especial: n8n entrega un objeto con .json que contiene lo que buscamos
    if (res.json && typeof res.json === 'object') {
      return this.extractData(res.json);
    }

    // 4. Si tiene pinta de ser un solo record
    if (res.id || res.name || (res.json && res.json.id)) {
      return [res];
    }

    return [];
  }

  private mapFromBackend(data: any[]): Usuario[] {
    return data.map(item => this.mapSingleFromBackend(item));
  }

  private mapSingleFromBackend(item: any): Usuario {
    // n8n envuelve cada item en una propiedad "json" por defecto.
    const d = (item && item.json && typeof item.json === 'object' && !Array.isArray(item.json)) 
              ? item.json 
              : item;

    return {
      // Mapeo robusto de ID ()
      id: d.id || d.ID || d.id_usuario || d.user_id || d.pk || d._id,
      nombre: d.name || d.nombre || d.username || '',
      apellido1: d.surname || d.apellido1 || d.last_name || '',
      apellido2: d.surname2 || d.apellido2 || '',
      email: d.email || d.user_email || '',
      enabled: d.enabled === true || d.enabled === 1 || d.enabled === '1' || d.status === 'active'
    };
  }

  // ── Helpers UI ──────────────────────────────────────────────────────────

  getById(id: number): Usuario | undefined {
    return this._usuarios().find(u => u.id === id);
  }

  fullName(u: Usuario): string {
    return [u.nombre, u.apellido1].filter(Boolean).join(' ');
  }

  initials(u: Usuario): string {
    return ((u.nombre[0] ?? '') + (u.apellido1[0] ?? '')).toUpperCase();
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
