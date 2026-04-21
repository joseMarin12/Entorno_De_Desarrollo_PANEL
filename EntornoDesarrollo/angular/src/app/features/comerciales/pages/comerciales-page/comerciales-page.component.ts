import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { ToastService } from '../../../../services/toast.service';
import { Comercial } from '../../../../models/comercial.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { ComercialesTableComponent } from '../../components/comerciales-table/comerciales-table.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ConfirmMode, ConfirmationModalComponent } from '../../../../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-comerciales-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    ComercialesTableComponent,
    ModalAddComponent,
    ModalEditComponent,
    ConfirmationModalComponent
],
  templateUrl: './comerciales-page.component.html',
})
export class ComercialesPageComponent implements OnInit {
  api = inject(ComercialesApiService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  private readonly _comerciales = signal<Comercial[]>([]);
  readonly comerciales = this._comerciales.asReadonly();
  readonly total = computed(() => this._comerciales().length);
  readonly totalActivos = computed(() => this._comerciales().filter(c => c.activo).length);
  readonly totalInactivos = computed(() => this._comerciales().filter(c => !c.activo).length);

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  activeFilter: FilterType = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 6;

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
  get filtered(): Comercial[] {
    return this.comerciales().filter(c => {
      let matchFilter = true;
      if (this.activeFilter === 'activos') {
        matchFilter = c.activo;
      } else if (this.activeFilter === 'baja') {
        matchFilter = !c.activo;
      }
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || this.fullName(c).toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }

  get paginatedComerciales(): Comercial[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedComercial(): Comercial | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  // ── Validación sincrónica ─────────────────────────
  get existingEmails(): string[] {
    return this.comerciales().map(c => c.email.toLowerCase());
  }

  get existingEmailsForEdit(): string[] {
    if (!this.selectedId) return [];
    return this.comerciales()
      .filter(c => c.id !== this.selectedId)
      .map(c => c.email.toLowerCase());
  }

  private loadAll(searchText = '', status = ''): void {
    this.api.findAll(searchText, status).subscribe({
      next: (list) => this._comerciales.set(list ?? []),
      error: () => this.toast.show('error', '✗ No se pudo cargar los comerciales. Inténtalo de nuevo.'),
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

  onSaveAdd(data: Omit<Comercial, 'id'>): void {
    this.api.create({ ...data, id: null }).subscribe({
      next: (created) => {
        this._comerciales.update(list => [created, ...list]);
        this.showAdd = false;
        this.toast.show('success', `✓ Comercial <strong>${data.nombre} ${data.primer_apellido}</strong> añadido correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo añadir el comercial. Inténtalo de nuevo.'),
    });
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }

  onSaveEdit(data: Comercial): void {
    this.api.update(data.id!, data).subscribe({
      next: (updated) => {
        this._comerciales.update(list => list.map(c => (c.id === data.id ? { ...c, ...updated } : c)));
        this.showEdit = false;
        this.selectedId = null;
        this.toast.show('info', `✎ Comercial <strong>${data.nombre} ${data.primer_apellido}</strong> actualizado`);
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
    const c = this.getById(this.selectedId)!;
    const wasActive = c.activo;
    this.api.toggleStatus(this.selectedId).subscribe({
      next: (updated) => {
        this._comerciales.update(list => list.map(item => (item.id === this.selectedId ? { ...item, ...updated } : item)));
        this.showBaja = false;
        this.selectedId = null;
        if (wasActive) {
          this.toast.show('warning', `⊘ Comercial <strong>${this.fullName(c)}</strong> dado de baja`);
        } else {
          this.toast.show('success', `↺ Comercial <strong>${this.fullName(c)}</strong> reactivado`);
        }
      },
      error: () => this.toast.show('error', '✗ No se pudo cambiar el estado. Inténtalo de nuevo.'),
    });
  }

  getById(id: number): Comercial | undefined {
    return this._comerciales().find(c => c.id === id);
  }

  fullName(c: Comercial): string {
    return [c.nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean).join(' ');
  }

}
