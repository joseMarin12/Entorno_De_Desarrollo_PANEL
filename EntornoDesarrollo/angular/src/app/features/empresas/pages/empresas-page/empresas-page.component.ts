import { Component, computed, inject, OnInit, signal, NO_ERRORS_SCHEMA } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { ToastService } from '../../../../services/toast.service';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { TableComponent } from '../../../../shared/table/table.component'; 
import { Empresa } from '../../../../models/empresa.model';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { EmpToolbarComponent, EmpFilterType, EmpFilterTipoType } from '../../components/toolbar/emp-toolbar.component';
import { ConfirmationModalComponent, ConfirmMode } from "../../../../shared/confirmation-modal/confirmation-modal.component";
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { EmpresasModalComponent } from "../../components/empresas-modal/empresas-modal.component";
import { EMPRESAS_COLUMNS } from './empresas-table.config'; 

// IMPORTAMOS NUESTRO MODAL CSV
import { ImportCsvModalComponent } from '../../../import-csv/pages/import-csv-page/import-csv-page-component';

@Component({
  selector: 'app-empresas-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    TableComponent, 
    StatsRowComponent,
    EmpToolbarComponent,
    EmpresasModalComponent,
    ConfirmationModalComponent,
    ImportCsvModalComponent // LO REGISTRAMOS AQUÍ
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './empresas-page.component.html',
})
export class EmpresasPageComponent implements OnInit {
  api = inject(EmpresasApiService);
  toast = inject(ToastService);
  private readonly router = inject(Router); 

  ConfirmMode = ConfirmMode;
  tableColumns = EMPRESAS_COLUMNS; 

  private readonly _empresas = signal<Empresa[]>([]);
  readonly empresas = this._empresas.asReadonly();

  // Para la paginación dinámica de la tabla
  private readonly _total = signal(0);
  readonly total = this._total.asReadonly();

  // ── SEÑALES FIJAS PARA LAS TARJETAS DE ESTADÍSTICAS GLOBALES ──
  private readonly _statsTotal = signal(0);
  private readonly _statsActivos = signal(0);
  private readonly _statsInactivos = signal(0);
  readonly statsTotal = this._statsTotal.asReadonly();
  readonly statsActivos = this._statsActivos.asReadonly();
  readonly statsInactivos = this._statsInactivos.asReadonly();

  // ── Filtros ──────────────────────────────────────
  searchQuery  = '';
  activeFilter: EmpFilterType = '';
  typeFilter: EmpFilterTipoType = '';
  currentPage  = signal(1);
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showAdd  = false;
  showEdit = false;
  showBaja = false;
  
  // NUEVO INTERRUPTOR MODAL CSV
  showImportModal = false;
  
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  // ── Computed ──────────────────────────────────────
  get selectedEmpresa(): Empresa | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  private loadAll(searchText = '', status = '', tipo = ''): void {
    this.api.findAll(searchText, status, tipo, this.currentPage(), this.PAGE_SIZE).subscribe({
      next: (res: any) => { 
        this._empresas.set(res.data ?? []);
        
        // El total filtrado maneja las páginas de la tabla
        this._total.set(res.totalFiltered ?? res.total ?? 0);
        
        // Las estadísticas superiores leen los contadores fijos (evita el baile)
        this._statsTotal.set(res.stats_total ?? res.total ?? 0);
        this._statsActivos.set(res.stats_activos ?? res.totalActivos ?? 0);
        this._statsInactivos.set(res.stats_inactivos ?? res.totalInactivos ?? 0);
      },
      error: () => this.toast.show('error', '✗ No se pudo cargar las empresas. Inténtalo de nuevo.'),
    });
  }

  /* Get CIF existentes para que no se repitan */
  get getExistingCIFs(): string[] {
    return this.empresas().map(e => e.cif.trim().toUpperCase());
  }
  
  get existingCIFsForEdit(): string[] {
    if (!this.selectedId) return [];
    return this.empresas()
      .filter(e => e.id !== this.selectedId)
      .map(e => e.cif.trim().toUpperCase());
  }

  // ── Handlers de la Tabla Compartida ─────────────────
  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'edit':
        this.onEditClick(event.id);
        break;
      case 'baja':
      case 'activar':
        this.onBajaClick(event.id);
        break;
      case 'location': 
        this.goToDirecciones(event.id);
        break;
      case 'phone': 
        this.goToContactos(event.id);
        break;
    }
  }

  // NUEVA FUNCIÓN PARA CUANDO SE SUBA EL CSV CON ÉXITO
  onCsvImportado(respuesta: any): void {
    this.toast.show('success', `✓ ${respuesta.message || 'CSV importado correctamente'}`);
    this.currentPage.set(1);
    this.loadAll(this.searchQuery, this.activeFilter, this.typeFilter); 
  }

  goToDirecciones(id: number): void {
    const emp = this.getById(id);
    this.router.navigate(['/empresas', id, 'direcciones'], {
      state: { nombreEmpresa: this.fullName(emp!) }
    });
  }

  goToContactos(id: number): void {
    this.router.navigate(['/empresas', id, 'contactos']);
  }

  // ── Handlers ──────────────────────────────────────
  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage.set(1);
    this.loadAll(q, this.activeFilter, this.typeFilter);
  }
  
  onFilterChange(f: EmpFilterType): void {
    this.activeFilter = f;
    this.currentPage.set(1);
    this.loadAll(this.searchQuery, f, this.typeFilter);
  }

  onTypeFilterChange(t: EmpFilterTipoType): void {
    this.typeFilter = t;
    this.currentPage.set(1);
    this.loadAll(this.searchQuery, this.activeFilter, t);
  }
  
  onPageChange(page:number): void {
    this.currentPage.set(page);
    this.loadAll(this.searchQuery, this.activeFilter, this.typeFilter);
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
        this.loadAll(this.searchQuery, this.activeFilter, this.typeFilter);
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
        this.loadAll(this.searchQuery, this.activeFilter, this.typeFilter);
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