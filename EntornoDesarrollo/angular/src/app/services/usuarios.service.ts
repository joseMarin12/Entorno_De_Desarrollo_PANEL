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
    console.log('add(data) recibida:', data);
    this.loading.set(true);
    this.error.set(null);
    try {
      const payload = {
        action: 'createUser',
        name: data.nombre,
        surname: data.apellido1,
        email: data.email,
        enabled: data.enabled ?? true,
        password: data.password || 'password123',
        role_id: data.role_id || 1
      };
      console.log('Enviando a n8n (add):', payload);
      const res = await firstValueFrom(this.http.post<any>(API_URL, payload));
      const responseData = Array.isArray(res) ? res[0] : (res.data ?? res);
      const mappedNewUser = this.mapSingleFromBackend(responseData);

      // Creamos el objeto final combinando lo que enviamos con lo que n8n nos devuelva (si devuelve algo)
      const finalNewUser: Usuario = {
        id: mappedNewUser.id || (responseData.id ? Number(responseData.id) : Date.now()),
        nombre: data.nombre,
        apellido1: data.apellido1,
        email: data.email,
        enabled: data.enabled ?? true,
        password: data.password || payload.password,
        role_id: Number(data.role_id || 1)
      };

      // Si el backend devolvió datos reales del usuario, dejamos que tengan prioridad
      const isRealUser = responseData && (responseData.id || responseData.name || responseData.email);
      if (isRealUser) {
        Object.assign(finalNewUser, mappedNewUser);
      }

      this._usuarios.update(list => [finalNewUser, ...list]);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al crear el usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async update(id: number, data: Omit<Usuario, 'id'>): Promise<void> {
    console.log('update(id, data) recibida:', id, data);
    this.loading.set(true);
    this.error.set(null);
    try {
      const existingUser = this.getById(id);

      const payload: any = {
        action: 'updateUser',
        id: id,
        name: data.nombre,
        surname: data.apellido1,
        email: data.email,
        enabled: data.enabled,
        role_id: data.role_id || 1
      };

      // Si hay nueva contraseña la usamos. Si no, usamos la que ya tiene el usuario
      if (data.password && data.password.trim() !== '') {
        console.log('Usando nueva contraseña del formulario');
        payload.password = data.password;
      } else if (existingUser && existingUser.password) {
        console.log('Usando contraseña existente del estado local');
        payload.password = existingUser.password;
      } else {
        console.warn('AVISO: No hay contraseña nueva ni se ha encontrado la anterior en el estado local.');
      }

      console.log('Enviando a n8n (update):', payload);
      const res = await firstValueFrom(this.http.post<any>(API_URL, payload));
      const updated = Array.isArray(res) ? res[0] : (res.data ?? res);
      
      this._usuarios.update(list => {
        const index = list.findIndex(u => u.id === id);
        if (index === -1) return list;
        
        const current = list[index];
        const mappedFromBackend = this.mapSingleFromBackend(updated);
        
        // 1. Empezamos con los datos actuales y aplicamos lo que enviamos (data)
        const merged = { 
          ...current, 
          nombre: data.nombre,
          apellido1: data.apellido1,
          email: data.email,
          enabled: data.enabled,
          role_id: data.role_id || current.role_id,
          password: data.password || current.password
        };

        // 2. Si el backend devolvió un objeto de usuario real (y no solo un mensaje de éxito),
        // dejamos que el mapeo del backend tenga la última palabra (por si hubo triggers en DB)
        // Identificamos un objeto real si tiene campos significativos más allá del ID
        const isRealUser = updated && (updated.name || updated.nombre || updated.email || updated.json);
        
        if (isRealUser) {
          Object.assign(merged, mappedFromBackend);
        }

        const newList = [...list];
        newList[index] = merged;
        return newList;
      });
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
      const u = this.getById(id);
      const newState = u ? !u.enabled : true;

      const payload = {
        action: 'Toogle status usuarios', // Nombre exacto que pusiste en n8n
        id: id,
        enabled: newState
      };
      
      console.log('Enviando a n8n (toggle):', payload);

      const res = await firstValueFrom(this.http.post<any>(API_URL, payload));
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

    console.log('Teclas en objeto n8n:', Object.keys(d));

    return {
      id: Number(d.id || d.ID || d.id_usuario || d.user_id || d.pk || d._id),
      nombre: d.name || d.nombre || d.username || d.nombre_usuario || '',
      apellido1: d.surname || d.apellido1 || d.last_name || d.primer_apellido || '',
      email: d.email || d.user_email || d.correo || '',
      enabled: d.enabled === true || d.enabled === 1 || d.enabled === '1' || d.status === 'active' || d.activo === true,
      password: d.password || d.pass || d.contraseña || d.pwd || '',
      role_id: d.role_id || d.ID_ROL || d.id_rol || ''
    };
  }

  // ── Helpers UI ──────────────────────────────────────────────────────────

  getById(id: number | string): Usuario | undefined {
    const numericId = Number(id);
    return this._usuarios().find(u => Number(u.id) === numericId);
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
