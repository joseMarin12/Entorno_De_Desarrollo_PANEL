import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Role } from '../../models/usuarios.model';
import { environment } from '../../../environments/environment';
import { RequestLoadingService } from '../request-loading.service';
import { BaseStore } from './base.store';

type RolesResponse = { data: any[] };

@Injectable({ providedIn: 'root' })
export class RolesStore extends BaseStore<Role> {
  private readonly http = inject(HttpClient);
  private readonly requestLoading = inject(RequestLoadingService);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  readonly roles = this.items;
  readonly hasRoles = this.hasItems;

  protected fetch(): Observable<Role[]> {
    return this.requestLoading.track(
      this.http.post<RolesResponse>(this.apiUrl, { action: 'getRole' })
    ).pipe(
      map(res => (res?.data ?? []).map((item: any) => {
        const json = item?.json ?? item;
        return { id: Number(json.id), name: json.name } as Role;
      }))
    );
  }
}
