import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormacionesApiService } from '../../../../services/formaciones.service'; // Asegúrate de que el nombre del archivo sea el correcto
import { ToastService } from '../../../../services/toast.service';
import { Formacion } from '../../../../models/formacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { FormacionesTableComponent } from '../../components/formaciones-table/formaciones-table.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ModalBajaComponent } from '../../components/modal-baja/modal-baja.component';
import { ConfirmMode, ConfirmationModalComponent } from '../../../../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-formaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    FormacionesTableComponent,
    ModalAddComponent,
    ModalEditComponent,
    ConfirmationModalComponent, // Cambiado aquí basándome en tu base
    ModalBajaComponent
  ],
  templateUrl: './formaciones-page.component.html',
})
export class FormacionesPageComponent implements OnInit {
  api = inject(FormacionesApiService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  // ── Estado (Signals) ──────────────────────────────
  private readonly _formaciones = signal<Formacion[]>([]);
  readonly formaciones = this._formaciones.asReadonly();

  readonly total = computed(() => this._formaciones().length);
  readonly totalActivos = computed(() => this._formaciones().filter(f => f.activo).length);
  readonly totalInactivos = computed(() => this._formaciones().filter(f => !f.activo).length);

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  activeFilter: FilterType = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showAdd = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  // ── Computed ──────────────────────────────────────
  get filtered(): Formacion[] {
    return this.formaciones().filter(f => {
      let matchFilter = true;
      if (this.activeFilter === 'activos') {
        matchFilter = f.activo === true;
      } else if (this.activeFilter === 'baja') {
        matchFilter = f.activo === false;
      }

      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || (f.curso && f.curso.toLowerCase().includes(q))
        || (f.denominacion && f.denominacion.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }

  get paginatedFormaciones(): Formacion[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedFormacion(): Formacion | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  private loadAll(searchText = '', status = ''): void {
    this.api.findAll(searchText, status).subscribe({
      next: (list) => this._formaciones.set(list ?? []),
      error: () => this.toast.show('error', '✗ No se pudo cargar las formaciones. Inténtalo de nuevo.'),
    });
  }

  // ── Handlers ──────────────────────────────────────
  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage = 1;
  }

  onFilterChange(f: FilterType): void {
    this.activeFilter = f;
    this.currentPage = 1;
  }

  openAdd(): void {
    this.showAdd = true;
  }

  onSaveAdd(data: Omit<Formacion, 'id'>): void {
    // Si TS se queja por el 'id: null', puedes usar 'id: null as any' temporalmente, 
    // pero lo ideal es que el DTO del backend lo acepte o se omita.
    this.api.create({ ...data, id: null as any }).subscribe({
      next: (created) => {
        this._formaciones.update(list => [created, ...list]);
        this.showAdd = false;
        this.toast.show('success', `✓ Formación <strong>${data.curso}</strong> añadida correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo añadir la formación. Inténtalo de nuevo.'),
    });
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }

  onSaveEdit(data: Formacion): void {
    this.api.update(data.id!, data).subscribe({
      next: (updated) => {
        this._formaciones.update(list => list.map(f => (f.id === data.id ? updated : f)));
        this.showEdit = false;
        this.selectedId = null;
        this.toast.show('info', `✎ Formación <strong>${data.curso}</strong> actualizada`);
      },
      error: () => this.toast.show('error', '✗ No se pudo guardar los cambios. Inténtalo de nuevo.'),
    });
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;

    const f = this.getById(this.selectedId)!;
    const wasActive = f.activo;

    this.api.toggleStatus(this.selectedId).subscribe({
      next: (updated) => {
        this._formaciones.update(list => list.map(item => (item.id === this.selectedId ? updated : item)));
        this.showBaja = false;
        this.selectedId = null;

        if (wasActive) {
          this.toast.show('warning', `⊘ Formación <strong>${f.curso}</strong> dada de baja`);
        } else {
          this.toast.show('success', `↺ Formación <strong>${f.curso}</strong> reactivada`);
        }
      },
      error: () => this.toast.show('error', '✗ No se pudo cambiar el estado. Inténtalo de nuevo.'),
    });
  }

  getById(id: number): Formacion | undefined {
    return this._formaciones().find(f => f.id === id);
  }
}