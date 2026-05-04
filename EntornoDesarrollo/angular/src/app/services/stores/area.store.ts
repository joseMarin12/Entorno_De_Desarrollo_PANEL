import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { KeyValue } from '../../models/keyValue.model';
import { FormacionesService } from '../formaciones.service';
import { BaseStore } from './base.store';

@Injectable({ providedIn: 'root' })
export class AreaStore extends BaseStore<KeyValue> {
  private readonly formacionesService = inject(FormacionesService);

  readonly areas = this.items;
  readonly hasAreas = this.hasItems;

  protected fetch(): Observable<KeyValue[]> {
    return this.formacionesService.findAreas();
  }
}
