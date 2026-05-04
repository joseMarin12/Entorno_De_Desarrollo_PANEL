import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormacionesService } from '../formaciones.service';
import { BaseStore } from './base.store';
import { KeyValue } from '../../models/keyValue.model';

@Injectable({ providedIn: 'root' })
export class EjecucionStore extends BaseStore<KeyValue> {
  private readonly formacionesService = inject(FormacionesService);

  readonly ejecuciones = this.items;
  readonly hasEjecuciones = this.hasItems;

  protected fetch(): Observable<KeyValue[]> {
    return this.formacionesService.findEjecuciones();
  }
}
