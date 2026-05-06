import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TopbarComponent } from "../../../../shared/topbar/topbar.component";
import { ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { DireccionesEmpresasApiService } from '../../../../services/direcciones-empresas-api.service';
import { ToastService } from '../../../../services/toast.service';
import { DireccionEmpresa } from '../../../../models/direccion-empresa.model';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { DirFilterPaisType, DirFilterType, ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { TableComponent } from "../../../../shared/table/table.component";
import { tableColumns } from './direcciones-table.config';
import { ConfirmationModalComponent } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { EmpresasApiService } from '../../../../services/empresas-api.service';

@Component({
  selector: 'app-empresas-direcciones-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    ModalAddComponent,
    ModalEditComponent,
    TableComponent,
    ConfirmationModalComponent
],
  templateUrl: './empresas-direcciones-page.component.html',
})
export class EmpresasDireccionesPageComponent implements OnInit {
  api = inject(DireccionesEmpresasApiService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;
  empresasApi = inject(EmpresasApiService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly _direcciones = signal<DireccionEmpresa[]>([]);
  readonly direcciones = this._direcciones.asReadonly();
  readonly total = computed(() => this._direcciones().length);
  readonly totalActivos = computed(() => this._direcciones().filter(d => d.activo).length);
  readonly totalInactivos = computed(() => this._direcciones().filter(d => !d.activo).length);

  // ── Filtros ──────────────────────────────────────
  searchQuery  = '';
  activeFilter: DirFilterType = '';
  typeFilter: DirFilterPaisType = '';
  currentPage = signal<number>(1);
  totalFiltered = signal<number>(0);
  readonly PAGE_SIZE = 10;
  
  tableColumns = tableColumns;

  nombreEmpresa = '';

  // ── Estado modales ────────────────────────────────
  showAdd = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    this.nombreEmpresa = history.state?.nombreEmpresa ?? '';
    this.loadAll();
  }

  // ── Computed ──────────────────────────────────────
  get filtered(): DireccionEmpresa[] {
    return this.direcciones().filter(d => {
      let matchFilter = true;
      if (this.activeFilter === 'activa') {
        matchFilter = d.activo;
      } else if (this.activeFilter === 'baja') {
        matchFilter = !d.activo;
      }

      const matchPais = this.typeFilter === '' ? true : d.pais === this.typeFilter;

      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q
        || d.direccion.toLowerCase().includes(q)
      return matchFilter && matchSearch && matchPais;
    });
  }  

  get empresaId(): number | null {
    return this.route.snapshot.paramMap.get('id') ? Number(this.route.snapshot.paramMap.get('id')) : null;
  }

  get paginatedDirecciones(): DireccionEmpresa[] {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get selectedDireccion(): DireccionEmpresa | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  private loadAll(searchText = '', status = '', empresaId = this.empresaId): void {
    this.api.findAll(searchText, status, empresaId!).subscribe({
      next: (list) => { 
        this._direcciones.set(list ?? []); 
      },
      error: () => this.toast.show('error', '✗ No se pudo cargar las direcciones. Inténtalo de nuevo.'),
    });
  }

  // ── Handlers ──────────────────────────────────────
  goToEmpresas(): void {
    this.router.navigate(['/empresas']);
  }

  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'edit': this.onEditClick(event.id); break;
      case 'baja': this.onBajaClick(event.id); break;
      case 'activar': this.onBajaClick(event.id); break;
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage.set(1);
  }
  
  onFilterChange(f: DirFilterType): void {
    this.activeFilter = f;
    this.currentPage.set(1);
  }

  onPaisFilterChange(p: DirFilterPaisType): void {
    this.typeFilter = p;
    this.currentPage.set(1);
  }

  openAdd(): void {
    this.showAdd = true;
  }

  onSaveAdd(data: Omit<DireccionEmpresa, 'id'>): void {
    console.log('data recibida en onSaveAdd:', JSON.stringify(data));
    this.api.create({ ...data }).subscribe({
      next: (created) => {
        this._direcciones.set([...this.direcciones(), created]);
        this.showAdd = false;
        this.toast.show('success', `✓ Dirección <strong>${data.direccion}</strong> añadida correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo añadir la dirección. Inténtalo de nuevo.'),
    });
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }
  
  onSaveEdit(data: DireccionEmpresa): void {
    this.api.update(data.id!, data).subscribe({
      next: (updated) => {
        this._direcciones.update(list => list.map(d => d.id === data.id ? updated : d));
        this.showEdit = false;
        this.selectedId = null;
        this.toast.show('info', `✎ Dirección <strong>${data.direccion}</strong> actualizada correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo actualizar la dirección. Inténtalo de nuevo.'),
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
        this._direcciones.update(list => list.map(item => item.id === this.selectedId ? updated : item));
        this.showBaja = false;
        this.selectedId = null;
        if (wasActive) {
          this.toast.show('warning', `⊘ Dirección dada de baja`);
        } else {
          this.toast.show('success', `↺ Dirección reactivada`);
        }
      },
      error: () => this.toast.show('error', '✗ No se pudo cambiar el estado de la dirección. Inténtalo de nuevo.'),
    });
  }

  getById(id: number): DireccionEmpresa | undefined {
    return this._direcciones().find(d => d.id === id);
  }
}
