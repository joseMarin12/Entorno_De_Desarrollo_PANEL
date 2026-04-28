import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AsignacionesService } from '../../../../services/asignaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Asignacion } from '../../../../models/asignacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { AsignacionesTableComponent } from '../../components/asignaciones-table/asignaciones-table.component';
import { ModalAsignacionComponent } from '../../components/modal-asignacion/modal-asignacion.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asignaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    AsignacionesTableComponent,
    ModalAsignacionComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './asignaciones-page.component.html',
})
export class AsignacionesPageComponent implements OnInit {
  svc = inject(AsignacionesService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  activeFilter: FilterType = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showForm = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.svc.loadAll(this.searchQuery, this.activeFilter, this.currentPage, this.PAGE_SIZE).subscribe();
  }

  // ── Getters para la vista ─────────────────────────
  get selectedAsignacion(): Asignacion | null {
    return this.selectedId != null ? (this.svc.getById(this.selectedId) ?? null) : null;
  }

  // ── Handlers ──────────────────────────────────────
  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage = 1;
    this.loadData();
  }

  onFilterChange(f: FilterType): void {
    this.activeFilter = f;
    this.currentPage = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  openAdd(): void {
    this.selectedId = null;
    this.showForm = true;
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showForm = true;
  }

  onSaveForm(data: any): void {
    if (this.selectedId) {
      this.svc.update(this.selectedId, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId = null;
          this.toast.show('info', `✎ Asignación actualizada correctamente.`);
        },
        error: () => this.toast.show('error', `✗ No se pudo guardar los cambios. Inténtalo de nuevo.`),
      });
    } else {
      this.svc.add(data).subscribe({
        next: () => {
          this.showForm = false;
          this.toast.show('success', `✓ Asignación añadida correctamente.`);
        },
        error: () => this.toast.show('error', `✗ No se pudo añadir la asignación. Inténtalo de nuevo.`),
      });
    }
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const c = this.svc.getById(this.selectedId)!;
    const wasActive = c.activo !== false; // Asumimos true por defecto
    this.svc.toggleActivo(this.selectedId).subscribe({
      next: () => {
        this.showBaja = false;
        this.selectedId = null;
        if (wasActive) {
          this.toast.show('warning', `⊘ Asignación dada de baja.`);
        } else {
          this.toast.show('success', `↺ Asignación reactivada.`);
        }
      },
      error: () => this.toast.show('error', `✗ No se pudo cambiar el estado. Inténtalo de nuevo.`),
    });
  }
}
