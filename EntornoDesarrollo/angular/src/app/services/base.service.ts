import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

type ApiResponse<TEntity> = { data: TEntity[] };

export abstract class BaseCrud<TEntity> {
    protected readonly http = inject(HttpClient);
    protected abstract readonly API_URL: string;

    protected _findAll<TBody extends object>(body: TBody): Observable<TEntity[]> {
        return this.http.post<ApiResponse<TEntity>>(this.API_URL, body)
            .pipe(map(res => res.data));
    }

    protected _create<TBody extends object>(body: TBody): Observable<TEntity> {
        return this.http.post<ApiResponse<TEntity>>(this.API_URL, body)
            .pipe(map(res => res.data[0]));
    }

    protected _update<TBody extends object>(body: TBody): Observable<TEntity> {
        return this.http.post<ApiResponse<TEntity>>(this.API_URL, body)
            .pipe(map(res => res.data[0]));
    }

    protected _toggleStatus<TBody extends object>(body: TBody): Observable<TEntity> {
        return this.http.post<ApiResponse<TEntity>>(this.API_URL, body)
            .pipe(map(res => res.data[0]));
    }
}