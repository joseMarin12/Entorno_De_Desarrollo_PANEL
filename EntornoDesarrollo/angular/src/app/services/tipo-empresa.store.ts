import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { TipoEmpresa } from '../models/tipo-empresa.model';
import { EmpresasApiService } from './empresas-api.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TipoEmpresaStore {
  private static readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

  private readonly empresasApi = inject(EmpresasApiService);
  private readonly cacheTtlMs =
    Number.isFinite(environment.tiposEmpresaCacheTtlMs) && environment.tiposEmpresaCacheTtlMs > 0
      ? environment.tiposEmpresaCacheTtlMs
      : TipoEmpresaStore.DEFAULT_TTL_MS;

  private readonly _tipos = signal<TipoEmpresa[]>([]);
  private readonly _loaded = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loadedAt = signal<number | null>(null);
  private inFlight$: Observable<TipoEmpresa[]> | null = null;

  readonly tipos = this._tipos.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loadedAt = this._loadedAt.asReadonly();
  readonly hasTipos = computed(() => this._tipos().length > 0);

  private isCacheValid(): boolean {
    const loadedAt = this._loadedAt();
    if (!this._loaded()) return false;
    if (this._tipos().length === 0) return false;
    if (loadedAt === null) return true;
    return Date.now() - loadedAt < this.cacheTtlMs;
  }

  ensureLoaded(force = false): Observable<TipoEmpresa[]> {
    if (!force && this.isCacheValid()) {
      return of(this._tipos());
    }

    if (!force && this.inFlight$) {
      return this.inFlight$;
    }

    this._loading.set(true);
    this._error.set(null);

    const request$ = this.empresasApi.findTipos().pipe(
      tap((tipos) => {
        this._tipos.set(tipos ?? []);
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
    this._tipos.set([]);
    this._loaded.set(false);
    this._loadedAt.set(null);
    this._error.set(null);
  }
}
