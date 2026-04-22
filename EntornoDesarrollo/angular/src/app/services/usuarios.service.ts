import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { Usuario } from '../models/usuarios.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService extends BaseCrud<Usuario> {

  protected override readonly API_URL = `${environment.apiUrl}/usuarios`;

  private _usuarios = signal<Usuario[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);
  readonly totalRecords = signal(0);

  readonly usuarios = this._usuarios.asReadonly();
  readonly total    = this.totalRecords.asReadonly();
  readonly activos  = computed(() => this._usuarios().filter((u: Usuario) => u.enabled).length);
  readonly inactivos= computed(() => this._usuarios().filter((u: Usuario) => !u.enabled).length);

  loadAll(page = 1, limit = 10, filters: any = {}): Observable<Usuario[]> {
    this.loading.set(true);
    this.error.set(null);
    return this._findAll({
      action: 'getUser',
      page,
      limit,
      filters,
    }).pipe(
      map(rawData => ({
        mapped: rawData.map((item: any) => this.mapSingleFromBackend(item)),
        rawData
      })),
      tap(({ mapped, rawData }) => {
        if (rawData.length > 0) {
          const firstRow = rawData[0] as any;
          const total = Number(firstRow.total_count || mapped.length);
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
    const payload = {
      action: 'createUser',
      name: data.nombre,
      surname: data.apellido1,
      email: data.email,
      enabled: data.enabled ?? true,
      password: data.password || 'password123',
      roleid: Number(data.roleid || 1)
    };

    return this._create(payload).pipe(
      map(res => this.applyRobustMerge(res, {
        ...data,
        id: (res as any)?.id ? Number((res as any).id) : Date.now(),
        roleid: payload.roleid,
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
    const payload: any = {
      action: 'updateUser',
      id,
      name: data.nombre,
      surname: data.apellido1,
      email: data.email,
      enabled: data.enabled,
      roleid: Number(data.roleid || 1)
    };

    if (data.password?.trim()) {
      payload.password = data.password;
    } else if (existing?.password) {
      payload.password = existing.password;
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
    const newState = u ? !u.enabled : true;

    const payload = {
      action: 'Toogle status usuarios',
      id,
      enabled: newState,
      activo: newState,
      enabled_int: newState ? 1 : 0
    };

    return this._toggleStatus(payload).pipe(
      map(res => this.applyRobustMerge(res, { ...u!, enabled: newState })),
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
      // Preserve password from localData if backend didn't return it
      const merged = { ...localData, ...mapped };
      if (!mapped.password && localData.password) {
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
}
