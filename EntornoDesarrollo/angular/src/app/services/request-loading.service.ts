import { Injectable, computed, signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RequestLoadingService {
  private readonly pendingCount = signal(0);

  readonly isLoading = computed(() => this.pendingCount() > 0);

  track<T>(source$: Observable<T>): Observable<T> {
    this.pendingCount.update(count => count + 1);
    return source$.pipe(
      finalize(() => {
        this.pendingCount.update(count => Math.max(0, count - 1));
      })
    );
  }
}
