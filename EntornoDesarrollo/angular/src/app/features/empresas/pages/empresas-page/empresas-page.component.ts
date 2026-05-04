import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../services/toast.service';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { EmpresasTableComponent } from '../../components/empresas-table/empresas-table.component';
import { Empresa } from '../../../../models/empresa.model';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { EmpToolbarComponent, EmpFilterType } from '../../components/toolbar/emp-toolbar.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ConfirmationModalComponent, ConfirmMode } from "../../../../shared/confirmation-modal/confirmation-modal.component";
import { EmpresasApiService } from '../../../../services/empresas-api.service';

@Component({
  selector: 'app-empresas-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    EmpresasTableComponent,
    StatsRowComponent,
    EmpToolbarComponent,
    ModalAddComponent,
    ModalEditComponent,
    ConfirmationModalComponent],
  templateUrl: './empresas-page.component.html',
})
export class EmpresasPageComponent implements OnInit {
  api = inject(EmpresasApiService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  private readonly _empresas = signal<Empresa[]>([]);
  readonly empresas = this._empresas.asReadonly();
  readonly total = computed(() => this._empresas().length);
  readonly totalActivos = computed(() => this._empresas().filter(e => e.activo).length);
  readonly totalInactivos = computed(() => this._empresas().filter(e => !e.activo).length);
  readonly tiposDisponibles = computed(() => {
    const unique = new Set(
      this._empresas()
        .map(e => (e.tipo ?? '').trim())
        .filter(tipo => tipo.length > 0)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  });

  // ── Filtros ──────────────────────────────────────
  searchQuery  = '';
  activeFilter: EmpFilterType = '';
  typeFilter: string = '';
  currentPage  = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showAdd  = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  // ── Computed ──────────────────────────────────────
  get filtered(): Empresa[] {
    return this.empresas().filter(e => {
      let matchFilter = true;
      if (this.activeFilter === 'activa') {
        matchFilter = e.activo;
      } else if (this.activeFilter === 'baja') {
        matchFilter = !e.activo;
      }

      const matchType = this.typeFilter === '' ? true : e.tipo === this.typeFilter;

      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || this.fullName(e).toLowerCase().includes(q)
      return matchFilter && matchSearch && matchType;
    });
  }

  get paginatedEmpresas(): Empresa[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedEmpresa(): Empresa | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  private loadAll(searchText = '', status = ''): void {
    this.api.findAll(searchText, status).subscribe({
      next: (list) => {
        this._empresas.set(list ?? []);
      },
      error: () => this.toast.show('error', '✗ No se pudo cargar las empresas. Inténtalo de nuevo.'),
    });
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

  onTypeFilterChange(t: string): void {
    this.typeFilter = t;
    this.currentPage = 1;
  }

  openAdd(): void {
    this.showAdd = true;
  }

  onSaveAdd(data: Omit<Empresa, 'id'>): void {
    this.api.create({ ...data, id: null }).subscribe({
      next: (created) => {
        this._empresas.update(list => [created, ...list]);
        this.showAdd = false;
        this.toast.show('success', `✓ Empresa <strong>${data.nombre}</strong> añadida correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo añadir la empresa. Inténtalo de nuevo.'),
    });
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }

  onSaveEdit(data: Empresa): void {
    this.api.update(data.id!, data).subscribe({
      next: (updated) => {
        this._empresas.update(list => list.map(e => e.id === data.id ? updated : e));
        this.showEdit = false;
        this.selectedId = null;
        this.toast.show('info', `✎ Empresa <strong>${data.nombre} ${data.razonSocial}</strong> actualizada correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo actualizar la empresa. Inténtalo de nuevo.'),
    });
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const e = this.getById(this.selectedId)!;
    const wasActive = e.activo;
    this.api.toggleStatus(this.selectedId).subscribe({
      next: (updated) => {
        this._empresas.update(list => list.map(item => item.id === this.selectedId ? updated : item));
        this.showBaja = false;
        this.selectedId = null;
        if (wasActive) {
          this.toast.show('warning', `⊘ Empresa <strong>${this.fullName(e)}</strong> dada de baja`);
        } else {
          this.toast.show('success', `↺ Empresa <strong>${this.fullName(e)}</strong> reactivada`);
        }
      },
      error: () => this.toast.show('error', '✗ No se pudo cambiar el estado de la empresa. Inténtalo de nuevo.'),
    });
  }

  getById(id: number): Empresa | undefined {
    return this._empresas().find(e => e.id === id);
  }

  fullName(e: Empresa): string {
    return [e.nombre, e.razonSocial].filter(Boolean).join(' ');
  }
}
