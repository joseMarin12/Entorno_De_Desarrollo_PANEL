import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SeleccionadoresService } from '../../../../services/seleccionadores.service';
import { ToastService } from '../../../../services/toast.service';
import { Seleccionador, TipoSeleccionador } from '../../../../models/seleccionador.model';

import { SelStatsRowComponent } from '../../components/stats-row/sel-stats-row.component';
import { SelToolbarComponent, SelFilterType, SelFilterTipoType } from '../../components/toolbar/sel-toolbar.component';
import { SelTableComponent } from '../../components/seleccionadores-table/sel-table.component';
import { SelModalFormComponent } from '../../components/modal-form/sel-modal-form.component';
import { SelModalConfirmComponent, ConfirmMode } from '../../components/modal-confirm/sel-modal-confirm.component';
import { SelModalDetailComponent } from '../../components/modal-detail/sel-modal-detail.component';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';

@Component({
  selector: 'app-seleccionadores-page',
  standalone: true,
  imports: [
    CommonModule,
    SelStatsRowComponent,
    SelToolbarComponent,
    SelTableComponent,
    SelModalFormComponent,
    SelModalConfirmComponent,
    SelModalDetailComponent,
    TopbarComponent,
  ],
  templateUrl: './seleccionadores-page.component.html',
})
export class SeleccionadoresPageComponent {
  svc   = inject(SeleccionadoresService);
  toast = inject(ToastService);

  // ── Filtros ───────────────────────────────────────────
  searchQuery:   string        = '';
  activeFilter:  SelFilterType = '';
  typeFilter:    SelFilterTipoType = '';
  currentPage = 1;
  readonly PAGE_SIZE = 6;

  // ── Estado modales ────────────────────────────────────
  showForm    = false;
  showConfirm = false;
  showDetail  = false;
  confirmMode: ConfirmMode = 'baja';
  selectedId: number | null = null;

  // ── Computed ──────────────────────────────────────────
  get filtered(): Seleccionador[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.svc.seleccionadores().filter(s => {
      // Filtro de estado (Activo/Inactivo)
      const matchFilter =
        this.activeFilter === ''       ? true :
        this.activeFilter === 'activo' ? s.activo : !s.activo;
      
      // Filtro de tipo (Interno/Externo)
      const matchType = 
        this.typeFilter === '' ? true : s.tipo === this.typeFilter;
        
      // Filtro de búsqueda por texto
      const text = `${s.nombre} ${s.ap1} ${s.ap2} ${s.email}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      
      return matchFilter && matchType && matchSearch;
    });
  }

  get paginated(): Seleccionador[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedSeleccionador(): Seleccionador | null {
    return this.selectedId != null ? (this.svc.getById(this.selectedId) ?? null) : null;
  }

  // ── Handlers ─────────────────────────────────────────
  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage = 1;
  }

  onFilterChange(f: SelFilterType): void {
    this.activeFilter = f;
    this.currentPage = 1;
  }

  onTypeFilterChange(t: SelFilterTipoType): void {
    this.typeFilter = t;
    this.currentPage = 1;
  }

  openAdd(): void {
    this.selectedId = null;
    this.showForm = true;
  }

  onDetailClick(id: number): void {
    this.selectedId = id;
    this.showDetail = true;
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showForm = true;
  }

  onSaveForm(data: Omit<Seleccionador, 'id'>): void {
    if (this.selectedId != null) {
      this.svc.update(this.selectedId, data);
      const name = `${data.nombre} ${data.ap1}`;
      this.toast.show('info', `✎ Seleccionador <strong>${name}</strong> actualizado`);
    } else {
      this.svc.add(data);
      const name = `${data.nombre} ${data.ap1}`;
      this.toast.show('success', `✓ Seleccionador <strong>${name}</strong> añadido`);
    }
    this.showForm = false;
    this.selectedId = null;
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.confirmMode = 'baja';
    this.showConfirm = true;
  }

  onActivarClick(id: number): void {
    this.selectedId = id;
    this.confirmMode = 'activar';
    this.showConfirm = true;
  }

  onConfirm(): void {
    if (this.selectedId == null) return;
    const s = this.svc.getById(this.selectedId)!;
    const name = `${s.nombre} ${s.ap1}`;
    this.svc.toggleActivo(this.selectedId);
    this.showConfirm = false;

    if (this.confirmMode === 'baja') {
      this.toast.show('warning', `⊘ Seleccionador <strong>${name}</strong> dado de baja`);
    } else {
      this.toast.show('success', `↺ Seleccionador <strong>${name}</strong> reactivado`);
    }
    this.selectedId = null;
  }
}
