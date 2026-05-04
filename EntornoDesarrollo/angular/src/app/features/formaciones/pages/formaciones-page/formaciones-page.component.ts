import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormacionesService } from '../../../../services/formaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Formacion } from '../../../../models/formacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent, StatCardConfig } from '../../../../shared/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { FormacionesTableComponent } from '../../components/formaciones-table/formaciones-table.component';
import { ModalFormacionComponent } from '../../components/modal-formacion/modal-formacion.component';
import { ModalParticipantesComponent } from '../../components/modal-participantes/modal-participantes.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-formaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    FormacionesTableComponent,
    ModalFormacionComponent,
    ModalParticipantesComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './formaciones-page.component.html',
})
export class FormacionesPageComponent implements OnInit {
  svc = inject(FormacionesService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  statCards = computed<StatCardConfig[]>(() => [
    { icon: 'users', value: this.svc.total(), label: 'Total formaciones', color: 'purple' },
    { icon: 'check-circle', value: this.svc.totalActivos(), label: 'Activas', color: 'green' },
    { icon: 'x-circle', value: this.svc.totalInactivos(), label: 'Dados de baja', color: 'red' },
  ]);

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  activeFilter: FilterType = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 10; // Actualizado a 10 según petición

  // ── Estado modales ────────────────────────────────
  showForm = false;
  showBaja = false;
  showParticipantes = false;
  readonly selectedId = signal<number | null>(null);

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.svc.loadAll(this.searchQuery, this.activeFilter, this.currentPage, this.PAGE_SIZE).subscribe();
  }

  // ── Getters para la vista ─────────────────────────
  readonly selectedformacion = computed<Formacion | null>(() => {
    const id = this.selectedId();
    return id != null ? (this.svc.getById(id) ?? null) : null;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    this.selectedId.set(null);
    this.showForm = true;
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.showForm = true;
  }

  onSaveForm(data: any): void {
    const id = this.selectedId();
    if (id) {
      // Editar
      this.svc.update(id, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId.set(null);
          this.toast.show('info', `✎ Formación <strong>${data.curso}</strong> actualizada`);
        },
        error: () => this.toast.show('error', `✗ No se pudo guardar los cambios. Inténtalo de nuevo.`),
      });
    } else {
      // Añadir
      this.svc.add(data).subscribe({
        next: () => {
          this.showForm = false;
          this.toast.show('success', `✓ Formación <strong>${data.curso}</strong> añadida correctamente`);
        },
        error: () => this.toast.show('error', `✗ No se pudo añadir la formación. Inténtalo de nuevo.`),
      });
    }
  }

  onBajaClick(id: number): void {
    this.selectedId.set(id);
    this.showBaja = true;
  }

  onParticipantesClick(id: number): void {
    this.selectedId.set(id);
    this.showParticipantes = true;
  }

  onConfirmBaja(): void {
    const id = this.selectedId();
    if (id == null) return;
    const c = this.svc.getById(id)!;
    const wasActive = c.activo === true;
    this.svc.toggleActivo(id).subscribe({
      next: () => {
        this.showBaja = false;
        this.selectedId.set(null);
        if (wasActive) {
          this.toast.show('warning', `⊘ Formación <strong>${this.svc.title(c)}</strong> dada de baja`);
        } else {
          this.toast.show('success', `↺ Formación <strong>${this.svc.title(c)}</strong> reactivada`);
        }
      },
      error: () => this.toast.show('error', `✗ No se pudo cambiar el estado. Inténtalo de nuevo.`),
    });
  }
}
