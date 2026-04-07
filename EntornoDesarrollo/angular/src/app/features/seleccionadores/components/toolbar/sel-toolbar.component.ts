import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SelFilterType = '' | 'activo' | 'baja';

@Component({
  selector: 'app-sel-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="toolbar" style="width: 100%; justify-content: space-between;">
      <div class="search-wrap" style="flex:1; max-width:360px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Buscar por nombre…"
          [(ngModel)]="searchValue"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>

      <select
        class="form-select" style="min-width: 180px; padding: 9px 12px; margin: 0 16px;"
        [(ngModel)]="filterValue"
        (ngModelChange)="filterChange.emit($event)"
      >
        <option value="">Todos</option>
        <option value="activo">Activos</option>
        <option value="baja">De baja</option>
      </select>

    </div>
  `,
})
export class SelToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<SelFilterType>();

  searchValue = '';
  filterValue: SelFilterType = '';
}
