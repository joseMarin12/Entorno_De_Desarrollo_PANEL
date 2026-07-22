import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeleccionadoresApiService, SeleccionadorStats } from '../../../../services/seleccionadores-api.service';
import { ToastService } from '../../../../services/toast.service';
import { Seleccionador } from '../../../../models/seleccionador.model';
import { SelStatsRowComponent } from '../../components/stats-row/sel-stats-row.component';
import { SelToolbarComponent, SelFilterType, SelFilterTipoType } from '../../components/toolbar/sel-toolbar.component';
import { SelModalFormComponent } from '../../components/modal-form/sel-modal-form.component';
import { SelModalDetailComponent } from '../../components/modal-detail/sel-modal-detail.component';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { TableComponent } from '../../../../shared/table/table.component';
import { tableColumns } from './seleccionadores-table.config';

// IMPORTAMOS NUESTRO MODAL CSV
import { ImportCsvModalComponent } from '../../../import-csv/pages/import-csv-page/import-csv-page-component';

@Component({
  selector: 'app-seleccionadores-page',
  standalone: true,
  imports: [
    CommonModule, SelStatsRowComponent, SelToolbarComponent, TableComponent,
    SelModalFormComponent, SelModalDetailComponent, TopbarComponent, ConfirmationModalComponent,
    ImportCsvModalComponent // LO REGISTRAMOS AQUÍ
  ],
  templateUrl: './seleccionadores-page.component.html',
})
export class SeleccionadoresPageComponent implements OnInit {
  api   = inject(SeleccionadoresApiService);
  toast = inject(ToastService);

  private readonly _seleccionadores = signal<Seleccionador[]>([]);
  // Empresas para resolver el nombre en la tabla/detalle (el formulario usa su propio lookup-select).
  private readonly _empresas = signal<{id: number, nombre: string}[]>([]);

  readonly seleccionadores = computed(() => {
    const empresas = this._empresas();
    return this._seleccionadores().map(s => {
      if (s.tipo === 'externo' && s.id_empresa && !s.empresa) {
        const emp = empresas.find(e => e.id === s.id_empresa);
        if (emp) return { ...s, empresa: { id: emp.id, nombre: emp.nombre || (emp as any).nombre_empresa } };
      }
      return s;
    });
  });

  // Stats globales del backend
  private readonly _stats = signal<SeleccionadorStats>({ total: 0, activos: 0, inactivos: 0, externos: 0 });
  readonly statsTotal     = computed(() => this._stats().total);
  readonly statsActivos   = computed(() => this._stats().activos);
  readonly statsInactivos = computed(() => this._stats().inactivos);
  readonly statsExternos  = computed(() => this._stats().externos);

  // Paginación server-side
  readonly PAGE_SIZE = 10;
  currentPage   = signal<number>(1);
  totalFiltered = signal<number>(0);

  tableColumns = tableColumns;
  selectedSeleccionador: Seleccionador | null = null;
  selectedSeleccionadorNombre = signal<string | null>(null);

  searchQuery  = signal<string>('');
  activeFilter = signal<SelFilterType>('');
  typeFilter   = signal<SelFilterTipoType>('');

  showForm    = false;
  showConfirm = false;
  showDetail  = false;
  
  // NUEVO INTERRUPTOR MODAL CSV
  showImportModal = false;

  confirmMode = ConfirmMode.DESACTIVAR;
  selectedId  = signal<number | null>(null);
  ConfirmMode = ConfirmMode;

  ngOnInit(): void {
    this.loadPage();
    this.loadEmpresas();
  }

  private loadEmpresas(): void {
    this.api.getEmpresas().subscribe({
      next: (empresas) => this._empresas.set(empresas ?? []),
      error: () => this.toast.show('error', '✗ No se pudieron cargar las empresas.')
    });
  }

  loadPage(): void {
    this.api.findAll(this.currentPage(), this.PAGE_SIZE, this.searchQuery(), this.activeFilter(), this.typeFilter())
      .subscribe({
        next: (page) => {
          this._seleccionadores.set(page.data);
          this.totalFiltered.set(page.totalFiltered);
          if (page.stats.total > 0 || page.data.length > 0) this._stats.set(page.stats);
        },
        error: () => this.toast.show('error', '✗ No se pudieron cargar los datos.')
      });
  }

  getById(id: number): Seleccionador | undefined {
    return this.seleccionadores().find(s => s.id === id);
  }

  readonly existingEmailsForEdit = computed(() => {
    const list = this.seleccionadores();
    const editId = this.selectedId();
    if (!editId) return list.filter(s => s && s.email).map(s => s.email!.toLowerCase());
    return list.filter(s => s && s.id !== editId && s.email).map(s => s.email!.toLowerCase());
  });

  onCsvImported(): void { this.currentPage.set(1); this.loadPage(); }

  onSearchChange(q: string): void { this.searchQuery.set(q); this.currentPage.set(1); this.loadPage(); }
  onFilterChange(f: SelFilterType): void { this.activeFilter.set(f); this.currentPage.set(1); this.loadPage(); }
  onTypeFilterChange(t: SelFilterTipoType): void { this.typeFilter.set(t); this.currentPage.set(1); this.loadPage(); }
  onPageChange(page: number): void { this.currentPage.set(page); this.loadPage(); }

  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'detail': this.onDetailClick(event.id); break;
      case 'edit': this.onEditClick(event.id); break;
      case 'baja': this.onBajaClick(event.id); break;
      case 'activar': this.onActivarClick(event.id); break;
    }
  }

  // NUEVA FUNCIÓN PARA CUANDO SE SUBA EL CSV CON ÉXITO
  onCsvImportado(respuesta: any): void {
    this.toast.show('success', `✓ ${respuesta.message || 'CSV importado correctamente'}`);
    this.currentPage.set(1);
    this.loadPage(); 
  }

  openAdd(): void {
    this.selectedId.set(null);
    this.selectedSeleccionador = null;
    this.showForm = true;
  }

  onDetailClick(id: number): void {
    this.selectedId.set(id); this.selectedSeleccionador = this.getById(id) ?? null; this.showDetail = true;
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.selectedSeleccionador = this.getById(id) ?? null;
    this.showForm = true;
  }

  onSaveForm(data: Omit<Seleccionador, 'id'>): void {
    const editId = this.selectedId();
    if (editId != null) {
      this.api.update(editId, data).subscribe({
        next: () => {
          const name = `${data.nombre} ${data.primer_apellido}`;
          this.toast.show('info', `✎ Seleccionador <strong>${name}</strong> actualizado`);
          this.closeForm(); this.loadPage();
        },
        error: () => this.toast.show('error', '✗ Error al actualizar seleccionador')
      });
    } else {
      this.api.create(data).subscribe({
        next: () => {
          const name = `${data.nombre} ${data.primer_apellido}`;
          this.toast.show('success', `✓ Seleccionador <strong>${name}</strong> añadido`);
          this.closeForm(); this.currentPage.set(1); this.loadPage();
        },
        error: () => this.toast.show('error', '✗ Error al crear seleccionador')
      });
    }
  }

  private closeForm() { this.showForm = false; this.selectedId.set(null); this.selectedSeleccionador = null; }

  onBajaClick(id: number): void {
    this.selectedId.set(id); this.confirmMode = ConfirmMode.DESACTIVAR;
    const s = this.getById(id);
    this.selectedSeleccionadorNombre.set(s ? `${s.nombre} ${s.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onActivarClick(id: number): void {
    this.selectedId.set(id); this.confirmMode = ConfirmMode.ACTIVAR;
    const s = this.getById(id);
    this.selectedSeleccionadorNombre.set(s ? `${s.nombre} ${s.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onConfirm(): void {
    const confirmId = this.selectedId();
    if (confirmId == null) return;
    const s = this.getById(confirmId)!;
    const name = `${s.nombre} ${s.primer_apellido}`;
    const wasActive = s.activo;
    this.api.toggleStatus(confirmId).subscribe({
      next: () => {
        this.showConfirm = false; this.selectedId.set(null);
        if (wasActive) this.toast.show('warning', `⊘ Seleccionador <strong>${name}</strong> dado de baja`);
        else this.toast.show('success', `↺ Seleccionador <strong>${name}</strong> reactivado`);
        this.loadPage();
      },
      error: () => this.toast.show('error', '✗ Error al cambiar el estado')
    });
  }
}