import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type UsuariosFilterType = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-usuarios-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <button class="view-tab" [class.active]="activeFilter() === 'inactivos'" (click)="setFilter('inactivos')">Inactivos</button>
      </div>

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
})
export class UsuariosToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<UsuariosFilterType>();
  @Output() importCsvClick = new EventEmitter<void>(); 

  searchValue = '';
  activeFilter = signal<UsuariosFilterType>('todos');

  setFilter(filter: UsuariosFilterType): void {
    this.activeFilter.set(filter);
    this.filterChange.emit(filter);
  }
  emitImportClick(): void { this.importCsvClick.emit(); }
}