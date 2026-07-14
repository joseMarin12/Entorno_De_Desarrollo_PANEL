import { Component, inject, OnInit, signal } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { ToastService } from '../../../../services/toast.service';
import { TableComponent } from '../../../../shared/table/table.component'; 
import { Empresa } from '../../../../models/empresa.model';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { EmpresasModalComponent } from "../../components/empresas-modal/empresas-modal.component";
import { ConfirmationModalComponent, ConfirmMode } from "../../../../shared/confirmation-modal/confirmation-modal.component";
import { ImportCsvModalComponent } from '../../../import-csv/pages/import-csv-page/import-csv-page-component';
import { EMPRESAS_COLUMNS } from './empresas-table.config'; 
import { EmpToolbarComponent, EmpFilterType, EmpFilterTipoType } from '../../components/toolbar/emp-toolbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';

@Component({
  selector: 'app-empresas-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TopbarComponent,
    StatsRowComponent,
    EmpToolbarComponent,
    TableComponent, 
    EmpresasModalComponent, 
    ConfirmationModalComponent, 
    ImportCsvModalComponent
  ],
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
  
  private readonly _statsTotal = signal(0);
  private readonly _statsActivos = signal(0);
  private readonly _statsInactivos = signal(0);
  readonly statsTotal = this._statsTotal.asReadonly();
  readonly statsActivos = this._statsActivos.asReadonly();
  readonly statsInactivos = this._statsInactivos.asReadonly();
  
  get total(): number { return this.statsTotal(); }
  
  searchQuery = '';
  activeFilter: EmpFilterType = '';
  typeFilter: EmpFilterTipoType = '';
  currentPage = signal(1);
  readonly PAGE_SIZE = 10;
  
  showAdd = false;
  showEdit = false;
  showBaja = false;
  showImportModal = false;
  selectedId: any = null;

  ngOnInit(): void { this.loadAll(); }

  private loadAll(): void {
    this.api.findAll(this.searchQuery, this.activeFilter, this.typeFilter, this.currentPage(), this.PAGE_SIZE).subscribe({
      next: (res: any) => { 
        this._empresas.set(res.data ?? []);
        this._statsTotal.set(res.stats_total ?? res.total ?? 0);
        this._statsActivos.set(res.stats_activos ?? 0);
        this._statsInactivos.set(res.stats_inactivos ?? 0);
      },
      error: () => this.toast.show('error', '✗ Error al cargar datos.'),
    });
  }

  onSearchChange(event: any): void { this.searchQuery = (event.target?.value ?? event); this.currentPage.set(1); this.loadAll(); }
  onFilterChange(event: any): void { this.activeFilter = (event.target?.value ?? event); this.currentPage.set(1); this.loadAll(); }
  onTypeFilterChange(event: any): void { this.typeFilter = (event.target?.value ?? event); this.currentPage.set(1); this.loadAll(); }
  onPageChange(page: number): void { this.currentPage.set(page); this.loadAll(); }

  openAdd(): void { this.showAdd = true; }
  
  onSaveAdd(data: Empresa): void {
    this.api.create(data).subscribe({
      next: () => { this.showAdd = false; this.loadAll(); this.toast.show('success', '✓ Empresa creada'); }
    });
  }

  onSaveEdit(data: Empresa): void {
    this.api.update(data.id!, data).subscribe({
      next: () => { this.showEdit = false; this.selectedId = null; this.loadAll(); this.toast.show('info', '✎ Empresa actualizada'); }
    });
  }

  onBajaClick(id: number): void { this.selectedId = id; this.showBaja = true; }
  onConfirmBaja(): void {
    this.api.toggleStatus(this.selectedId).subscribe(() => { this.showBaja = false; this.selectedId = null; this.loadAll(); });
  }

  onCsvImportado(event: any): void { this.showImportModal = false; this.loadAll(); }

  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'edit': this.onEditClick(event.id); break;
      case 'baja': case 'activar': this.onBajaClick(event.id); break;
      case 'location': this.goToDirecciones(event.id); break;
      case 'phone': this.goToContactos(event.id); break;
    }
  }

  onEditClick(id: any): void { this.selectedId = id; this.showEdit = true; }

  get existingCIFsForEdit(): string[] {
    return this.empresas().filter(e => String(e.id) !== String(this.selectedId)).map(e => e.cif.trim().toUpperCase());
  }

  get selectedEmpresa(): Empresa | null {
    return this.selectedId ? (this.empresas().find(e => String(e.id) === String(this.selectedId)) ?? null) : null;
  }

  goToDirecciones(id: number): void {
    const emp = this.empresas().find(e => e.id === id);
    this.router.navigate(['/empresas', id, 'direcciones'], { state: { nombreEmpresa: this.fullName(emp!) } });
  }

  goToContactos(id: number): void { this.router.navigate(['/empresas', id, 'contactos']); }

  fullName(e: Empresa): string { return [e.nombre, e.razonSocial].filter(Boolean).join(' '); }
}