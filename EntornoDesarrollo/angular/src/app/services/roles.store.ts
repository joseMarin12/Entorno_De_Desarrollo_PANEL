import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { Role } from '../models/usuarios.model';
import { environment } from '../../environments/environment';
import { RequestLoadingService } from './request-loading.service';

type RolesResponse = { data: any[] };

@Injectable({ providedIn: 'root' })
export class RolesStore {
  private static readonly DEFAULT_ROLES_TTL_MS = 24 * 60 * 60 * 1000;

  private readonly http = inject(HttpClient);
  private readonly requestLoading = inject(RequestLoadingService);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;
  private readonly cacheTtlMs =
    Number.isFinite(environment.rolesCacheTtlMs) && environment.rolesCacheTtlMs > 0
      ? environment.rolesCacheTtlMs
      : RolesStore.DEFAULT_ROLES_TTL_MS;

  private readonly _roles = signal<Role[]>([]);
  private readonly _loaded = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loadedAt = signal<number | null>(null);
  private inFlight$: Observable<Role[]> | null = null;

  readonly roles = this._roles.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasRoles = computed(() => this._roles().length > 0);
  readonly loadedAt = this._loadedAt.asReadonly();

  private isCacheValid(): boolean {
    const loadedAt = this._loadedAt();
    if (!this._loaded()) {
      return false;
    }

    if (this._roles().length === 0) {
      return false;
    }

    // Compatibility: roles loaded by previous in-memory state before loadedAt was introduced.
    if (loadedAt === null) {
      return true;
    }

    return Date.now() - loadedAt < this.cacheTtlMs;
  }

  ensureLoaded(force = false): Observable<Role[]> {
    if (!force && this.isCacheValid()) {
      return of(this._roles());
    }

    if (!force && this.inFlight$) {
      return this.inFlight$;
    }

    this._loading.set(true);
    this._error.set(null);

    const request$ = this.requestLoading.track(
      this.http.post<RolesResponse>(this.apiUrl, { action: 'getRole' })
    ).pipe(
      map(res => (res?.data ?? []).map((item: any) => {
        const json = item?.json ?? item;
        return { id: Number(json.id), name: json.name } as Role;
      })),
      tap((roles) => {
        this._roles.set(roles);
        this._loaded.set(true);
        this._loadedAt.set(Date.now());
      }),
      finalize(() => {
        this._loading.set(false);
        this.inFlight$ = null;
      }),
      shareReplay(1)
    );

    this.inFlight$ = request$;
    return request$;
  }

  clear(): void {
    this._roles.set([]);
    this._loaded.set(false);
    this._loadedAt.set(null);
    this._error.set(null);
  }
}
