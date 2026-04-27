import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { RequestLoadingService } from './request-loading.service';

type ApiResponse<TEntity> = { data: TEntity[] };

export abstract class BaseCrud<TEntity> {
  protected readonly http = inject(HttpClient);
  protected readonly requestLoading = inject(RequestLoadingService);
  protected abstract readonly API_URL: string;

  protected trackRequest<T>(source$: Observable<T>): Observable<T> {
    return this.requestLoading.track(source$);
  }

  protected _findAll<TBody extends object>(body: TBody): Observable<TEntity[]> {
    return this.trackRequest(this.http.post<ApiResponse<TEntity>>(this.API_URL, body))
      .pipe(map(res => res.data));
  }

  protected _create<TBody extends object>(body: TBody): Observable<TEntity> {
    return this.trackRequest(this.http.post<ApiResponse<TEntity>>(this.API_URL, body))
      .pipe(map(res => res.data[0]));
  }

  protected _update<TBody extends object>(body: TBody): Observable<TEntity> {
    return this.trackRequest(this.http.post<ApiResponse<TEntity>>(this.API_URL, body))
      .pipe(map(res => res.data[0]));
  }

  protected _toggleStatus<TBody extends object>(body: TBody): Observable<TEntity> {
    return this.trackRequest(this.http.post<ApiResponse<TEntity>>(this.API_URL, body))
      .pipe(map(res => res.data[0]));
  }
}
