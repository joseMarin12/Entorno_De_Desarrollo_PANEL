import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LookupService {
  private http = inject(HttpClient);

  getOptions(apiUrl: string, action: string, dependsOnValue?: any, dependsOnField = 'parentId'): Observable<any[]> {
    const body: any = { action };
    if (dependsOnValue !== undefined && dependsOnValue !== null) {
      body[dependsOnField] = dependsOnValue;
    }
    return this.http.post<{ data: any[] }>(apiUrl, body)
      .pipe(map(res => res.data));
  }
}
