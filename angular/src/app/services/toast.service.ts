import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  show(type: ToastType, message: string): void {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.remove(id), 3200);
  }

  remove(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
