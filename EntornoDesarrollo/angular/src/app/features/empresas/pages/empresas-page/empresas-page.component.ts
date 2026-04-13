import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../services/toast.service';
import { EmpresasService } from '../../../../services/empresas.service';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { EmpresasTableComponent } from '../../components/empresas-table/empresas-table.component';
import { FilterType } from '../../../comerciales/components/toolbar/toolbar.component';
import { Empresa } from '../../../../models/empresa.model';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { EmpToolbarComponent, EmpFilterType, EmpFilterTipoType } from '../../components/toolbar/emp-toolbar.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ModalBajaComponent } from '../../components/modal-baja/modal-baja.component';

@Component({
  selector: 'app-empresas-page',
  standalone: true,
  imports: [CommonModule, TopbarComponent, EmpresasTableComponent, StatsRowComponent, EmpToolbarComponent, ModalAddComponent, ModalEditComponent, ModalBajaComponent ],
  templateUrl: './empresas-page.component.html',
})
export class EmpresasPageComponent {
  svc = inject(EmpresasService);
  toast = inject(ToastService);

  // ── Filtros ──────────────────────────────────────
  searchQuery  = '';
  activeFilter: EmpFilterType = '';
  typeFilter: EmpFilterTipoType = '';
  currentPage  = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showAdd  = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Computed ──────────────────────────────────────
  get filtered(): Empresa[] {
    return this.svc.empresas().filter(e => {
      const matchFilter =
        this.activeFilter === ''   ? true :
        this.activeFilter === 'activa' ? e.activo : !e.activo;

      const matchType = 
        this.typeFilter === '' ? true : e.tipo === this.typeFilter;

      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || this.svc.fullName(e).toLowerCase().includes(q)
      return matchFilter && matchSearch && matchType;
    });
  }

  get paginatedEmpresas(): Empresa[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedEmpresa(): Empresa | null {
    return this.selectedId != null ? (this.svc.getById(this.selectedId) ?? null) : null;
  }

  // ── Handlers ──────────────────────────────────────
    onSearchChange(q: string): void {
      this.searchQuery = q;
      this.currentPage = 1;
    }
  
    onFilterChange(f: EmpFilterType): void {
      this.activeFilter = f;
      this.currentPage = 1;
    }

    onTypeFilterChange(t: EmpFilterTipoType): void {
        this.typeFilter = t;
        this.currentPage = 1;
    }
  
  openAdd(): void {
    this.showAdd = true;
  }

  onSaveAdd(data: Omit<Empresa, 'id'>): void {
    this.svc.add(data);
    this.showAdd = false;
    this.toast.show('success', `✓ Empresa <strong>${data.nombre}</strong> añadida correctamente`);
  }

  onSaveEdit(data: Empresa): void {
    this.svc.update(data.id, data);
    this.showEdit = false;
    this.selectedId = null;
    this.toast.show('info', `✎ Empresa <strong>${data.nombre}</strong> actualizada correctamente`);
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const e = this.svc.getById(this.selectedId)!;
    const wasActive = e.activo;
    this.svc.toggleActivo(this.selectedId);
    this.showBaja = false;
    this.selectedId = null;
    if (wasActive) {
      this.toast.show('warning', `⊘ Empresa <strong>${this.svc.fullName(e)}</strong> dada de baja`);
    } else {
      this.toast.show('success', `↺ Empresa <strong>${this.svc.fullName(e)}</strong> reactivada`);
    }
  }
}
