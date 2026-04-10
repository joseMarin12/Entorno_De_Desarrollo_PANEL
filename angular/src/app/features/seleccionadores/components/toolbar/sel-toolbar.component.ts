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
    <div class="toolbar sel-toolbar">

      <!-- Búsqueda -->
      <div class="search-wrap" style="flex:1; max-width:340px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Buscar seleccionador…"
          [(ngModel)]="searchValue"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>

      <!-- Filtro por tipo -->
      <select
        class="form-select toolbar-select"
        [(ngModel)]="tipoValue"
        (ngModelChange)="tipoFilterChange.emit($event)"
      >
        <option value="">Todos los tipos</option>
        <option value="interno">Interno</option>
        <option value="externo">Externo</option>
      </select>

      <!-- Filtro por estado -->
      <select
        class="form-select toolbar-select"
        [(ngModel)]="filterValue"
        (ngModelChange)="filterChange.emit($event)"
      >
        <option value="">Todos los estados</option>
        <option value="activo">Activos</option>
        <option value="baja">De baja</option>
      </select>

    </div>
  `,
  styles: [`
    .sel-toolbar { margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .toolbar-select { min-width: 165px; padding: 9px 12px; }
    @media (max-width: 640px) {
      .toolbar-select { width: 100%; }
      .search-wrap { max-width: 100% !important; width: 100%; }
    }
  `]
})
export class SelToolbarComponent {
  @Output() searchChange     = new EventEmitter<string>();
  @Output() filterChange     = new EventEmitter<SelFilterType>();
  @Output() tipoFilterChange = new EventEmitter<SelFilterTipoType>();

  searchValue = '';
  filterValue: SelFilterType     = '';
  tipoValue:   SelFilterTipoType = '';
}
