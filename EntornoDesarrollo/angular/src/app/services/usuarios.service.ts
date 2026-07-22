import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { Usuario, Role } from '../models/usuarios.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService extends BaseCrud<Usuario> {

  public override readonly API_URL = `${environment.apiUrl}/api/usuarios`;

  private _usuarios = signal<Usuario[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);
  readonly totalRecords = signal(0);

  readonly usuarios = this._usuarios.asReadonly();
  readonly total    = this.totalRecords.asReadonly();
  
  // Computados adaptados para leer limpiamente la propiedad enabled del modelo
  readonly activos  = computed(() => this._usuarios().filter((u: Usuario) => u.enabled).length);
  readonly inactivos= computed(() => this._usuarios().filter((u: Usuario) => !u.enabled).length);

  private _roles = signal<Role[]>([]);
  readonly roles = this._roles.asReadonly();

  loadRoles(): void {
    this._findAll<{ action: string }>({ action: 'getRole' }).subscribe({
      next: (res: any[]) => {
        if (!res) return;
        const roles = res.map(r => {
          const json = r.json || r;
          return { id: Number(json.id), name: json.name };
        });
        this._roles.set(roles);
      },
      error: (e) => console.error('Error loading roles', e)
    });
  }

  loadAll(page = 1, limit = 10, filters: any = {}): Observable<Usuario[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this._findAll({
      action: 'getUser',
      page,
      limit,
      filters,
    }).pipe(
      map(rawData => {
        // Si el backend responde un array vacío real o con el objeto fantasma filtrado por el WHERE
        if (!rawData || rawData.length === 0 || rawData[0]?.id === null) {
          return { mapped: [], rawData: [] };
        }
        return {
          mapped: rawData.map((item: any) => this.mapSingleFromBackend(item)),
          rawData
        };
      }),
      tap(({ mapped, rawData }) => {
        if (rawData.length > 0) {
          const firstRow = rawData[0] as any;
          // Alineado con las estadísticas globales calculadas en el CTE de n8n
          const total = Number(firstRow.total_filtered || firstRow.stats_total || mapped.length);
          this.totalRecords.set(total);
        } else {
          this.totalRecords.set(0);
        }
        this._usuarios.set(mapped);
      }),
      map(({ mapped }) => mapped),
      catchError(e => {
        const msg = e?.message ?? 'Error al cargar los usuarios';
        this.error.set(msg);
        return throwError(() => new Error(msg));
      }),
      tap({ finalize: () => this.loading.set(false) })
    );
  }

  add(data: Omit<Usuario, 'id'>): Observable<Usuario> {
    this.loading.set(true);
    this.error.set(null);

    // MODIFICACIÓN CRUCIAL: Encapsulado en usuarioData para que n8n lo capture directo del Webhook
    const payload = {
      action: 'createUser',
      usuarioData: {
        nombre: data.nombre,
        primer_apellido: data.apellido1,
        segundo_apellido: (data as any).apellido2 || null, // Manejo por si extiendes el modelo
        telefono: (data as any).telefono || null,
        email: data.email,
        rol: data.roleid ? String(data.roleid) : '1',
        activo: data.enabled ?? true,
        id_empresa: (data as any).id_empresa || null
      },
      password: data.password || 'password123' // Se mantiene en la raíz por seguridad o compatibilidad secundaria
    };

    return this._create(payload).pipe(
      map(res => this.applyRobustMerge(res, {
        ...data,
        id: (res as any)?.id ? Number((res as any).id) : Date.now(),
        roleid: Number(payload.usuarioData.rol),
        password: payload.password
      })),
      tap(newUser => {
        this._usuarios.update(list => [newUser, ...list]);
      }),
      catchError(e => {
        const msg = e?.message ?? 'Error al crear el usuario';
        this.error.set(msg);
        return throwError(() => new Error(msg));
      }),
      tap({ finalize: () => this.loading.set(false) })
    );
  }

  update(id: number, data: Omit<Usuario, 'id'>): Observable<Usuario> {
    this.loading.set(true);
    this.error.set(null);
    const existing = this.getById(id);

    // MODIFICACIÓN CRUCIAL: Encapsulado bajo usuarioData para unificar con el validador lineal de n8n
    const payload: any = {
      action: 'updateUser',
      id,
      usuarioData: {
        nombre: data.nombre,
        primer_apellido: data.apellido1,
        segundo_apellido: (data as any).apellido2 || null,
        telefono: (data as any).telefono || null,
        email: data.email,
        rol: data.roleid ? String(data.roleid) : '1',
        activo: data.enabled,
        id_empresa: (data as any).id_empresa || null
      }
    };

    const targetPassword = data.password?.trim() || existing?.password;
    if (targetPassword) {
      payload.password = targetPassword;
    }

    return this._update(payload).pipe(
      map(res => this.applyRobustMerge(res, {
        ...existing!,
        ...data,
        password: payload.password || existing?.password
      })),
      tap(updatedUser => {
        this._usuarios.update(list => list.map(u => u.id === id ? updatedUser : u));
      }),
      catchError(e => {
        const msg = e?.message ?? 'Error al actualizar el usuario';
        this.error.set(msg);
        return throwError(() => new Error(msg));
      }),
      tap({ finalize: () => this.loading.set(false) })
    );
  }

  toggleActivo(id: number): Observable<Usuario> {
    this.loading.set(true);
    this.error.set(null);
    const u = this.getById(id);
    if (!u) {
      this.error.set('Usuario no encontrado');
      return throwError(() => new Error('Usuario no encontrado'));
    }

    const newState = !u.enabled;

    const payload = {
      action: 'Toogle status usuarios', // Mantiene el typo 'Toogle' para coincidir con el Switch de n8n
      id,
      enabled: newState,
      activo: newState,
      enabled_int: newState ? 1 : 0
    };

    return this._toggleStatus(payload).pipe(
      map(res => this.applyRobustMerge(res, { ...u, enabled: newState })),
      tap(updatedUser => {
        this._usuarios.update(list => list.map(user => user.id === id ? updatedUser : user));
      }),
      catchError(e => {
        const msg = e?.message ?? 'Error al cambiar el estado del usuario';
        this.error.set(msg);
        return throwError(() => new Error(msg));
      }),
      tap({ finalize: () => this.loading.set(false) })
    );
  }

  private applyRobustMerge(backendRes: any, localData: Usuario): Usuario {
    const mapped = this.mapSingleFromBackend(backendRes);
    const isReal = backendRes && (backendRes.id || backendRes.nombre || backendRes.name || backendRes.email);
    
    if (isReal) {
      const cleanedMapped: any = {};
      const raw = (backendRes.json && typeof backendRes.json === 'object') ? backendRes.json : backendRes;

      if (raw.id || raw.ID || raw.id_usuario) cleanedMapped.id = mapped.id;
      if (raw.name || raw.nombre || raw.username) cleanedMapped.nombre = mapped.nombre;
      if (raw.surname || raw.apellido1 || raw.last_name) cleanedMapped.apellido1 = mapped.apellido1;
      if (raw.email || raw.user_email) cleanedMapped.email = mapped.email;
      if (raw.enabled !== undefined || raw.activo !== undefined || raw.status !== undefined) cleanedMapped.enabled = mapped.enabled;
      if (raw.password || raw.pass) cleanedMapped.password = mapped.password;
      if (raw.roleid || raw.role_id || raw.ID_ROL || raw.id_rol) cleanedMapped.roleid = mapped.roleid;

      const merged = { ...localData, ...cleanedMapped };
      
      if (!cleanedMapped.password && localData.password) {
        merged.password = localData.password;
      }
      return merged;
    }
    return localData;
  }

  private mapSingleFromBackend(item: any): Usuario {
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
      roleid: Number(d.roleid || d.role_id || d.ID_ROL || d.id_rol || 1)
    };
  }

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

  changePassword(id: number, password: string): Observable<any> {
    const payload = {
      action: 'changePassword',
      id,
      password
    };
    return this.http.post(this.API_URL, payload);
  }
}
