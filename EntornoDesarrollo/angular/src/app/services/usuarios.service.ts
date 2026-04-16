import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Usuario } from '../models/usuarios.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService extends BaseCrud<Usuario> {

  protected override readonly API_URL = `${environment.apiUrl}/usuarios`;

  // ── Estado reactivo ──────────────────────────────────────────────────────
  private _usuarios = signal<Usuario[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);

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
        this._findAll({
          action: 'getUser',
          filters: { searchText, status },
        })
      );
      // BaseCrud ya devuelve el array de datos (o undefined si falla el formato)
      const mapped = (res || []).map(item => this.mapSingleFromBackend(item));
      this._usuarios.set(mapped);
    } catch (e: any) {
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
      const payload = {
        action: 'createUser',
        name: data.nombre,
        surname: data.apellido1,
        email: data.email,
        enabled: data.enabled ?? true,
        password: data.password || 'password123',
        role_id: Number(data.role_id || 1)
      };

      const res = await firstValueFrom(this._create(payload));
      
      // Construimos el usuario final mezclando lo enviado con la respuesta del backend
      const newUser = this.applyRobustMerge(res, {
        ...data,
        id: res?.id ? Number(res.id) : Date.now(),
        role_id: payload.role_id,
        password: payload.password
      });

      this._usuarios.update(list => [newUser, ...list]);
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
      const existing = this.getById(id);
      const payload: any = {
        action: 'updateUser',
        id,
        name: data.nombre,
        surname: data.apellido1,
        email: data.email,
        enabled: data.enabled,
        role_id: Number(data.role_id || 1)
      };

      // Lógica de preservación de contraseña
      if (data.password?.trim()) {
        payload.password = data.password;
      } else if (existing?.password) {
        payload.password = existing.password;
      }

      const res = await firstValueFrom(this._update(payload));
      
      this._usuarios.update(list => {
        return list.map(u => {
          if (u.id === id) {
             return this.applyRobustMerge(res, {
               ...u,
               ...data,
               password: payload.password || u.password
             });
          }
          return u;
        });
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
        action: 'Toogle status usuarios',
        id,
        enabled: newState,
        activo: newState,
        enabled_int: newState ? 1 : 0
      };

      const res = await firstValueFrom(this._toggleStatus(payload));
      
      this._usuarios.update(list => 
        list.map(user => user.id === id 
          ? this.applyRobustMerge(res, { ...user, enabled: newState }) 
          : user
        )
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error al cambiar el estado del usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Mapeadores y Mezcla Robustas ──────────────────────────────────────────

  /**
   * Mezcla de forma segura la respuesta del backend con los datos locales.
   * Si el backend devuelve un objeto real (con nombre o email), confiamos en el mapeo.
   * Si no, mantenemos los datos que enviamos para evitar que la fila se quede vacía o gris.
   */
  private applyRobustMerge(backendRes: any, localData: Usuario): Usuario {
    const mapped = this.mapSingleFromBackend(backendRes);
    
    // Identificamos respuesta real si el objeto tiene datos significativos
    const isReal = backendRes && (backendRes.id || backendRes.nombre || backendRes.name || backendRes.email);
    
    if (isReal) {
      return { ...localData, ...mapped };
    }
    return localData;
  }

  private mapSingleFromBackend(item: any): Usuario {
    // n8n a veces envuelve en .json
    const d = (item && item.json && typeof item.json === 'object' && !Array.isArray(item.json)) 
              ? item.json 
              : item;

    if (!d || typeof d !== 'object') return {} as Usuario;

    return {
      id: Number(d.id || d.ID || d.id_usuario || 0),
      nombre: d.name || d.nombre || d.username || '',
      apellido1: d.surname || d.apellido1 || d.last_name || '',
      email: d.email || d.user_email || '',
      enabled: d.enabled === true || d.enabled === 1 || d.enabled === '1' || d.status === 'active' || d.activo === true,
      password: d.password || d.pass || d.contraseña || '',
      role_id: Number(d.role_id || d.ID_ROL || d.id_rol || 1)
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
