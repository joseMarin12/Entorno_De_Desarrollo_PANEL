import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LookupService {
  private http = inject(HttpClient);

  getOptions(apiUrl: string, action: string): Observable<any[]> {
    return this.http.post<{ data: any[] }>(apiUrl, { action })
      .pipe(map(res => res.data));
  }
}
