import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TipoEmpresa } from '../../../../models/tipo-empresa.model';
import { EmpresasApiService } from '../../../../services/empresas-api.service';

export type EmpFilterType = '' | 'activa' | 'baja';
export type EmpFilterTipoType = string;

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emp-toolbar.component.html',
})
export class EmpToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<EmpFilterType>();
  @Output() tipoFilterChange = new EventEmitter<EmpFilterTipoType>();
  
  // NUEVO EVENTO PARA EL BOTÓN CSV
  @Output() importCsvClick = new EventEmitter<void>();

  private empresasApi = inject(EmpresasApiService);
  private _tipos = signal<TipoEmpresa[]>([]);
  readonly tipos = this._tipos.asReadonly();

  searchValue = '';
  filterValue: EmpFilterType = '';
  tipoFilterValue: EmpFilterTipoType = '';

  async ngOnInit(): Promise<void> {
    const tipos = await firstValueFrom(this.empresasApi.findTipos());
    this._tipos.set(tipos);
  }

  emitImportClick(): void {
    this.importCsvClick.emit();
  }
}