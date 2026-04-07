import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComercialesService } from '../../../../services/comerciales.service';
import { ToastService } from '../../../../services/toast.service';
import { Comercial } from '../../../../models/comercial.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { ComercialesTableComponent } from '../../components/comerciales-table/comerciales-table.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ModalBajaComponent } from '../../components/modal-baja/modal-baja.component';

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
    ModalBajaComponent,
  ],
  templateUrl: './comerciales-page.component.html',
})
export class ComercialesPageComponent {
  svc   = inject(ComercialesService);
  toast = inject(ToastService);

  // ── Filtros ──────────────────────────────────────
  searchQuery  = '';
  activeFilter: FilterType = 'todos';
  currentPage  = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showAdd  = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Computed ──────────────────────────────────────
  get filtered(): Comercial[] {
    return this.svc.comerciales().filter(c => {
      const matchFilter =
        this.activeFilter === 'todos'   ? true :
        this.activeFilter === 'activos' ? c.activo : !c.activo;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || this.svc.fullName(c).toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }

  get paginatedComerciales(): Comercial[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedComercial(): Comercial | null {
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
    this.showAdd = true;
  }

  onSaveAdd(data: Omit<Comercial, 'id'>): void {
    this.svc.add(data);
    this.showAdd = false;
    this.toast.show('success', `✓ Comercial <strong>${data.nombre} ${data.apellido1}</strong> añadido correctamente`);
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }

  onSaveEdit(data: Comercial): void {
    this.svc.update(data.id, data);
    this.showEdit = false;
    this.selectedId = null;
    this.toast.show('info', `✎ Comercial <strong>${data.nombre} ${data.apellido1}</strong> actualizado`);
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const c = this.svc.getById(this.selectedId)!;
    const wasActive = c.activo;
    this.svc.toggleActivo(this.selectedId);
    this.showBaja = false;
    this.selectedId = null;
    if (wasActive) {
      this.toast.show('warning', `⊘ Comercial <strong>${this.svc.fullName(c)}</strong> dado de baja`);
    } else {
      this.toast.show('success', `↺ Comercial <strong>${this.svc.fullName(c)}</strong> reactivado`);
    }
  }

  exportCSV(): void {
    const rows = [['ID', 'Nombre', 'Apellido 1', 'Apellido 2', 'Teléfono', 'Email', 'Estado']];
    this.filtered.forEach(c =>
      rows.push([String(c.id), c.nombre, c.apellido1, c.apellido2, c.telefono, c.email, c.activo ? 'Activo' : 'Inactivo'])
    );
    const csv  = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'comerciales.csv'; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('info', '⬇ Exportación descargada');
  }
}
