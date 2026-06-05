import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type FilterType = 'todos' | 'activos' | 'baja';

export interface SearchEvent {
  text: string;
}

@Component({
  selector: 'app-shared-filter',
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
          [placeholder]="placeholder"
          [(ngModel)]="searchText"
          (ngModelChange)="emitSearch()"
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
    </div>
  `
})
export class SharedFilterComponent {
  @Input() placeholder = 'Buscar por nombre, email…';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterType>();

  searchText = '';
  activeFilter = signal<FilterType>('todos');

  emitSearch(): void {
    this.searchChange.emit(this.searchText);
  }

  setFilter(f: FilterType): void {
    this.activeFilter.set(f);
    this.filterChange.emit(f);
  }
}
