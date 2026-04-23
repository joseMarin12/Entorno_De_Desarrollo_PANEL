import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormacionesService } from '../../../../services/formaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Formacion } from '../../../../models/formacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
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

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  activeFilter: FilterType = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showForm = false; // Unificado para añadir/editar
  showBaja = false;
  showParticipantes = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.svc.loadAll().subscribe();
  }

  // ── Computed ──────────────────────────────────────
  get filtered(): Formacion[] {
    const formaciones = this.svc.formaciones();
    if(!formaciones || formaciones.length === 0) return [];
    return formaciones.filter(c => {
      const matchFilter =
        this.activeFilter === 'todos' ? true :
          this.activeFilter === 'activos' ? c.activo === true : c.activo === false;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || this.svc.title(c).toLowerCase().includes(q)
        || (c.denominacion && c.denominacion.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }

  get paginatedformaciones(): Formacion[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedformacion(): Formacion | null {
    return this.selectedId != null ? (this.svc.getById(this.selectedId) ?? null) : null;
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
    this.selectedId = null;
    this.showForm = true;
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showForm = true;
  }

  onSaveForm(data: any): void {
    if (this.selectedId) {
      // Editar
      this.svc.update(this.selectedId, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId = null;
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
    this.selectedId = id;
    this.showBaja = true;
  }

  onParticipantesClick(id: number): void {
    this.selectedId = id;
    this.showParticipantes = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const c = this.svc.getById(this.selectedId)!;
    const wasActive = c.activo === true;
    this.svc.toggleActivo(this.selectedId).subscribe({
      next: () => {
        this.showBaja = false;
        this.selectedId = null;
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
