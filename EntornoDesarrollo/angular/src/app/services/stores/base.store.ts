import { computed, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export abstract class BaseStore<T> {
  private static readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

  protected readonly cacheTtlMs =
    Number.isFinite(environment.cacheTtlMs) && environment.cacheTtlMs > 0
      ? environment.cacheTtlMs
      : BaseStore.DEFAULT_TTL_MS;

  private readonly _items = signal<T[]>([]);
  private readonly _loaded = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loadedAt = signal<number | null>(null);
  private inFlight$: Observable<T[]> | null = null;

  readonly items = this._items.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loadedAt = this._loadedAt.asReadonly();
  readonly hasItems = computed(() => this._items().length > 0);

  protected abstract fetch(): Observable<T[]>;

  private isCacheValid(): boolean {
    const loadedAt = this._loadedAt();
    if (!this._loaded()) return false;
    if (this._items().length === 0) return false;
    if (loadedAt === null) return true;
    return Date.now() - loadedAt < this.cacheTtlMs;
  }

  ensureLoaded(force = false): Observable<T[]> {
    if (!force && this.isCacheValid()) {
      return of(this._items());
    }

    if (!force && this.inFlight$) {
      return this.inFlight$;
    }

    this._loading.set(true);
    this._error.set(null);

    const request$ = this.fetch().pipe(
      tap((items) => {
        this._items.set(items ?? []);
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
    this._items.set([]);
    this._loaded.set(false);
    this._loadedAt.set(null);
    this._error.set(null);
  }
}
