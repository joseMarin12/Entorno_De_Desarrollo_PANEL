import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CsvImportComponent, CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { Comercial } from '../../../../models/comercial.model';

export type FilterType = 'todos' | 'activos' | 'baja';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, CsvImportComponent],
  template: `
    <div class="toolbar" style="display: flex; gap: 1rem; align-items: center; width: 100%;">
      <div class="search-wrap">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="search-input" type="text" placeholder="Buscar por nombre, email…" [(ngModel)]="searchValue" (ngModelChange)="searchChange.emit($event)" />
      </div>
      <div class="view-tabs">
        <button class="view-tab" [class.active]="activeFilter() === 'todos'" (click)="setFilter('todos')">Todos</button>
        <button class="view-tab" [class.active]="activeFilter() === 'activos'" (click)="setFilter('activos')">Activos</button>
        <button class="view-tab" [class.active]="activeFilter() === 'baja'" (click)="setFilter('baja')">Dados de baja</button>
      </div>

      <app-csv-import
        [columns]="csvColumns"
        [importRow]="importComercialRow"
        [rowLabel]="csvRowLabel"
        (imported)="dataChanged.emit()"
      />

    </div>
  `,
})
export class ToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterType>();
  @Output() dataChanged  = new EventEmitter<void>();

  private api = inject(ComercialesApiService);
  private emailsEnEsteLote = new Set<string>();

  searchValue = '';
  activeFilter = signal<FilterType>('todos');

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'nombre', label: 'nombre', required: true, hint: 'Nombre de pila' },
    { key: 'primer_apellido', label: 'primer_apellido', required: true, hint: 'Primer apellido' },
    { key: 'telefono', label: 'telefono', required: true, hint: 'Solo números, espacios y el símbolo +' },
    { key: 'email', label: 'email', required: true, hint: 'No puede repetirse uno ya registrado' },
    { key: 'segundo_apellido', label: 'segundo_apellido', required: false, hint: 'Opcional' },
  ];

  csvRowLabel = (row: Record<string, string>): string =>
    `${row['nombre']} ${row['primer_apellido']}`;

  importComercialRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    const email = row['email'].trim();
    const emailLower = email.toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return throwError(() => new Error('Formato de correo inválido'));
    }
    if (!/^[0-9+\s]+$/.test(row['telefono'].trim())) {
      return throwError(() => new Error('Formato de teléfono inválido'));
    }
    if (this.emailsEnEsteLote.has(emailLower)) {
      return throwError(() => new Error('Este correo ya está registrado'));
    }

    const data: Comercial = {
      id: null,
      nombre: row['nombre'].trim(),
      primer_apellido: row['primer_apellido'].trim(),
      segundo_apellido: row['segundo_apellido'] || '',
      telefono: row['telefono'].trim(),
      email,
      activo: true,
    };

    return this.api.create(data).pipe(
      map(() => {
        this.emailsEnEsteLote.add(emailLower);
        return {};
      }),
      catchError(err => {
        const msg = (err?.error?.message || err?.message || '').toLowerCase();
        if (msg.includes('duplicate') || msg.includes('unique')) {
          return throwError(() => new Error('Este correo ya está registrado'));
        }
        return throwError(() => new Error(err?.error?.message || err?.message || 'No se pudo crear el comercial'));
      })
    );
  };

  setFilter(f: FilterType): void {
    this.activeFilter.set(f);
    this.filterChange.emit(f);
  }
  emitImportClick(): void { this.importCsvClick.emit(); }
}
