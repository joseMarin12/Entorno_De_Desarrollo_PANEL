import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';
import { CsvImportComponent, CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { SeleccionadoresApiService } from '../../../../services/seleccionadores-api.service';
import { Seleccionador } from '../../../../models/seleccionador.model';

export type SelFilterType     = '' | 'activo' | 'baja';
export type SelFilterTipoType = '' | 'interno' | 'externo';

@Component({
  selector: 'app-sel-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, CsvImportComponent],
  template: `
    <div class="toolbar sel-toolbar" style="display: flex; gap: 1rem; align-items: center; width: 100%;">
      <div class="search-wrap" style="max-width: 420px; flex: 1;">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" type="text" placeholder="Buscar seleccionador…" [(ngModel)]="searchValue" (ngModelChange)="searchChange.emit($event)" />
      </div>
      <select class="form-select custom-select" [(ngModel)]="tipoValue" (ngModelChange)="tipoFilterChange.emit($event)">
        <option value="">Todos los tipos</option><option value="interno">Interno</option><option value="externo">Externo</option>
      </select>
      <select class="form-select custom-select" [(ngModel)]="filterValue" (ngModelChange)="filterChange.emit($event)">
        <option value="">Todos los estados</option><option value="activo">Activos</option><option value="baja">De baja</option>
      </select>

      <app-csv-import
        [columns]="csvColumns"
        [importRow]="importSeleccionadorRow"
        [rowLabel]="csvRowLabel"
        (imported)="dataChanged.emit()"
      />

    </div>
  `,
  styles: [`
    .sel-toolbar {
      flex-wrap: wrap;
    }
    .custom-select {
      width: 200px;
      height: 38px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .custom-select { width: 100%; }
      .search-wrap { max-width: 100% !important; }
    }
  `]
})
export class SelToolbarComponent {
  @Output() searchChange     = new EventEmitter<string>();
  @Output() filterChange     = new EventEmitter<SelFilterType>();
  @Output() tipoFilterChange = new EventEmitter<SelFilterTipoType>();
  @Output() dataChanged      = new EventEmitter<void>();

  private api = inject(SeleccionadoresApiService);
  private empresas: { id: number; nombre: string }[] = [];
  private emailsEnEsteLote = new Set<string>();

  searchValue = '';
  filterValue: SelFilterType     = '';
  tipoValue:   SelFilterTipoType = '';

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'nombre', label: 'nombre', required: true, hint: 'Nombre de pila' },
    { key: 'primer_apellido', label: 'primer_apellido', required: true, hint: 'Primer apellido' },
    { key: 'tipo', label: 'tipo (interno/externo)', required: true, hint: 'Debe ser exactamente "interno" o "externo"' },
    { key: 'email', label: 'email (obligatorio si tipo=externo)', required: false, hint: 'Obligatorio solo si tipo=externo' },
    { key: 'telefono', label: 'telefono', required: false, hint: 'Solo números, espacios y el símbolo + (opcional)' },
    { key: 'empresa', label: 'empresa (obligatorio si tipo=externo)', required: false, hint: 'Nombre de una empresa ya existente; obligatorio solo si tipo=externo' },
    { key: 'fecha_ini', label: 'fecha_ini (AAAA-MM-DD)', required: false, hint: 'Formato AAAA-MM-DD (opcional)' },
    { key: 'salario', label: 'salario', required: false, hint: 'Número mayor que 0 (opcional)' },
    { key: 'fee', label: 'fee (0-100)', required: false, hint: 'Porcentaje entre 0 y 100 (opcional)' },
  ];

  csvRowLabel = (row: Record<string, string>): string =>
    `${row['nombre']} ${row['primer_apellido']}`;

  async ngOnInit(): Promise<void> {
    this.empresas = await firstValueFrom(this.api.getEmpresas());
  }

  importSeleccionadorRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    const tipo = row['tipo'].trim().toLowerCase();
    if (tipo !== 'interno' && tipo !== 'externo') {
      return throwError(() => new Error('El campo "tipo" debe ser "interno" o "externo"'));
    }

    const data: Omit<Seleccionador, 'id'> = {
      nombre: row['nombre'].trim(),
      primer_apellido: row['primer_apellido'].trim(),
      segundo_apellido: '',
      tipo: tipo as 'interno' | 'externo',
      activo: true,
    };

    if (tipo === 'externo') {
      const email = (row['email'] || '').trim();
      if (!email) return throwError(() => new Error('El email es obligatorio para seleccionadores externos'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return throwError(() => new Error('Formato de correo inválido'));
      }
      const emailLower = email.toLowerCase();
      if (this.emailsEnEsteLote.has(emailLower)) {
        return throwError(() => new Error('Este correo ya está registrado'));
      }

      const empresaTexto = (row['empresa'] || '').trim().toLowerCase();
      if (!empresaTexto) return throwError(() => new Error('La empresa es obligatoria para seleccionadores externos'));
      const empresa = this.empresas.find(e => e.nombre.trim().toLowerCase() === empresaTexto);
      if (!empresa) return throwError(() => new Error(`La empresa "${row['empresa']}" no existe`));

      if (row['telefono'] && !/^[0-9+\s-]{6,15}$/.test(row['telefono'].trim())) {
        return throwError(() => new Error('Formato de teléfono inválido'));
      }

      let salario: number | undefined;
      if (row['salario']) {
        salario = Number(row['salario'].replace(',', '.'));
        if (!Number.isFinite(salario) || salario <= 0) {
          return throwError(() => new Error('El salario debe ser un número mayor que 0'));
        }
      }

      let fee: number | undefined;
      if (row['fee']) {
        fee = Number(row['fee'].replace(',', '.'));
        if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
          return throwError(() => new Error('El fee debe ser un número entre 0 y 100'));
        }
      }

      data.email = email;
      data.telefono = row['telefono'] || '';
      data.id_empresa = empresa.id;
      data.fecha_ini = row['fecha_ini'] || undefined;
      data.salario = salario;
      data.fee = fee;
    }

    return this.api.create(data).pipe(
      map(() => {
        if (data.email) this.emailsEnEsteLote.add(data.email.toLowerCase());
        return {};
      }),
      catchError(err => {
        const msg = (err?.error?.message || err?.message || '').toLowerCase();
        if (msg.includes('duplicate') || msg.includes('unique')) {
          return throwError(() => new Error('Este correo ya está registrado'));
        }
        return throwError(() => new Error(err?.error?.message || err?.message || 'No se pudo crear el seleccionador'));
      })
    );
  };
}
