import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type FilterType = 'todos' | 'activos' | 'baja';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="toolbar">
      <div class="search-wrap">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Buscar por nombre, email…"
          [(ngModel)]="searchValue"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>

      <div class="view-tabs">
        <button
          class="view-tab"
          [class.active]="activeFilter() === 'todos'"
          (click)="setFilter('todos')"
        >Todos</button>
        <button
          class="view-tab"
          [class.active]="activeFilter() === 'activos'"
          (click)="setFilter('activos')"
        >Activos</button>
        <button
          class="view-tab"
          [class.active]="activeFilter() === 'baja'"
          (click)="setFilter('baja')"
        >Dados de baja</button>
      </div>

      <button class="btn btn-outline" style="margin-left:auto;" (click)="exportCsv.emit()">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Exportar
      </button>
    </div>
  `,
})
export class ToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterType>();
  @Output() exportCsv    = new EventEmitter<void>();

  searchValue = '';
  activeFilter = signal<FilterType>('todos');

  setFilter(f: FilterType): void {
    this.activeFilter.set(f);
    this.filterChange.emit(f);
  }
}
