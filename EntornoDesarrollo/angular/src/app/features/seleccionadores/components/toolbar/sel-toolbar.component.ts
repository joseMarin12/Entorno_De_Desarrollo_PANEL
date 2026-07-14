import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SelFilterType     = '' | 'activo' | 'baja';
export type SelFilterTipoType = '' | 'interno' | 'externo';

@Component({
  selector: 'app-sel-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

      <!-- BOTÓN CARGA MASIVA CSV (Alineado a la derecha) -->
      <button class="btn btn-primary" style="background-color: #476fab; border: none; margin-left: auto; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; color: white; font-size: 14px; font-weight: 500;" (click)="emitImportClick()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Carga masiva CSV
      </button>
    </div>
  `,
  styles: [`
    .sel-toolbar { flex-wrap: wrap; }
    .custom-select { width: 200px; height: 38px; cursor: pointer; }
    @media (max-width: 768px) { .custom-select { width: 100%; } .search-wrap { max-width: 100% !important; } }
  `]
})
export class SelToolbarComponent {
  @Output() searchChange     = new EventEmitter<string>();
  @Output() filterChange     = new EventEmitter<SelFilterType>();
  @Output() tipoFilterChange = new EventEmitter<SelFilterTipoType>();
  @Output() importCsvClick   = new EventEmitter<void>();

  searchValue = '';
  filterValue: SelFilterType     = '';
  tipoValue:   SelFilterTipoType = '';

  emitImportClick(): void { this.importCsvClick.emit(); }
}