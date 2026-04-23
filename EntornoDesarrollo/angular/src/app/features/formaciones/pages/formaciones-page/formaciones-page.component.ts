import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

  // ── Filtros (Signals para que computed() los detecte) ─────────────────────
  readonly searchQuery = signal('');
  readonly activeFilter = signal<FilterType>('todos');
  readonly currentPage = signal(1);
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showForm = false; // Unificado para añadir/editar
  showBaja = false;
  showParticipantes = false;
  readonly selectedId = signal<number | null>(null);

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.svc.loadAll().subscribe();
  }

  // ── Computed (memoizados: solo recalculan si cambia alguna dependencia) ───
  readonly filtered = computed(() => {
    const formaciones = this.svc.formaciones();
    const filter = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();

    return formaciones.filter(c => {
      const matchFilter =
        filter === 'todos' ? true :
          filter === 'activos' ? c.activo === true : c.activo === false;

      const matchSearch = !q
        || this.svc.title(c).toLowerCase().includes(q)
        || (c.denominacion && c.denominacion.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  });

  readonly paginatedformaciones = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filtered().slice(start, start + this.PAGE_SIZE);
  });

  readonly selectedformacion = computed<Formacion | null>(() => {
    const id = this.selectedId();
    return id != null ? (this.svc.getById(id) ?? null) : null;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
  }

  onFilterChange(f: FilterType): void {
    this.activeFilter.set(f);
    this.currentPage.set(1);
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
