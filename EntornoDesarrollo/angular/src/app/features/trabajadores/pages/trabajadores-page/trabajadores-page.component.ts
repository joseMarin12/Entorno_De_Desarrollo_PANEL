import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrabajadoresApiService, TrabajadorStats } from '../../../../services/trabajadores-api.service';
import { ToastService } from '../../../../services/toast.service';
import { Trabajador } from '../../../../models/trabajador.model';
import { TrabStatsRowComponent } from '../../components/stats-row/trab-stats-row.component';
import { TrabToolbarComponent, TrabFilterType, TrabFilterTipoType } from '../../components/toolbar/trab-toolbar.component';
import { TrabModalFormComponent } from '../../components/modal-form/trab-modal-form.component';
import { TrabModalDetailComponent } from '../../components/modal-detail/trab-modal-detail.component';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { TableComponent } from '../../../../shared/table/table.component';
import { TRABAJADORES_COLUMNS } from './trabajadores-table.config';
import { CsvImportExportComponent } from '../../../../shared/csv-import-export/csv-import-export.component';
import { CsvColumnDef } from '../../../../shared/csv-import-export/csv.service';

@Component({
  selector: 'app-trabajadores-page',
  standalone: true,
  imports: [
    CommonModule, TrabStatsRowComponent, TrabToolbarComponent, TableComponent,
    TrabModalFormComponent, TrabModalDetailComponent, TopbarComponent, ConfirmationModalComponent,
    CsvImportExportComponent
  ],
  templateUrl: './trabajadores-page.component.html',
})
export class TrabajadoresPageComponent implements OnInit {
  api = inject(TrabajadoresApiService);
  toast = inject(ToastService);

  private readonly _trabajadores = signal<Trabajador[]>([]);
  readonly trabajadores = this._trabajadores.asReadonly();

  // Stats
  private readonly _stats = signal<TrabajadorStats>({ total: 0, activos: 0, inactivos: 0, freelances: 0 });
  readonly statsTotal = computed(() => this._stats().total);
  readonly statsActivos = computed(() => this._stats().activos);
  readonly statsInactivos = computed(() => this._stats().inactivos);
  readonly statsFreelances = computed(() => this._stats().freelances);

  // Lookups reales (cargados desde n8n)
  readonly provincias = signal<{id: number, nombre: string}[]>([]);
  readonly localidades = signal<{id: number, id_provincia: number, nombre: string}[]>([]);
  readonly seleccionadores = signal<{id: number, nombre: string, tipo: string}[]>([]);
  readonly tiposDoc = signal<{id: number, tipo: string}[]>([]);

  // Datos de relaciones para el modal de detalle
  readonly detailAsignaciones = signal<any[]>([]);
  readonly detailFormaciones = signal<any[]>([]);
  readonly detailDocumentos = signal<any[]>([]);

  // Paginación
  readonly PAGE_SIZE = 10;
  currentPage = signal<number>(1);
  totalFiltered = signal<number>(0);

  tableColumns = TRABAJADORES_COLUMNS;
  selectedTrabajador: Trabajador | null = null;
  selectedTrabajadorNombre = signal<string | null>(null);
  selectedDocumentoToDelete: any = null;
  confirmCustomTitle = signal<string | undefined>(undefined);
  confirmCustomDesc = signal<string | null>(null);

  searchQuery = signal<string>('');
  activeFilter = signal<TrabFilterType>('');
  typeFilter = signal<TrabFilterTipoType>('');

  csvColumns: CsvColumnDef[] = [
    { key: 'nombre', header: 'nombre', type: 'text' },
    { key: 'primer_apellido', header: 'primer_apellido', type: 'text' },
    { key: 'segundo_apellido', header: 'segundo_apellido', type: 'text' },
    { key: 'telefono', header: 'telefono', type: 'text' },
    { key: 'email', header: 'email', type: 'text' },
    { key: 'dni_nif_pasaporte', header: 'dni_nif_pasaporte', type: 'text' },
    { key: 'salario', header: 'salario', type: 'number' },
    { key: 'cheques_guarderia', header: 'cheques_guarderia', type: 'number' },
    { key: 'cheques_restaurante', header: 'cheques_restaurante', type: 'number' },
    { key: 'direccion', header: 'direccion', type: 'text' },
    { key: 'nacionalidad', header: 'nacionalidad', type: 'text' },
    { key: 'fecha_nacimiento', header: 'fecha_nacimiento', type: 'date' },
    { key: 'id_seleccionadores', header: 'id_seleccionadores', type: 'number' },
    { key: 'activo', header: 'activo', type: 'boolean' },
    { key: 'fecha_ini', header: 'fecha_ini', type: 'date' },
    { key: 'fecha_fin', header: 'fecha_fin', type: 'date' },
    { key: 'codigo_postal', header: 'codigo_postal', type: 'text' },
    { key: 'id_localidad', header: 'id_localidad', type: 'number' },
    { key: 'freelance', header: 'freelance', type: 'boolean' },
    { key: 'id_provincia', header: 'id_provincia', type: 'number' }
  ];

  showForm = false;
  showConfirm = false;
  showDetail = false;
  confirmMode = ConfirmMode.DESACTIVAR;
  selectedId = signal<number | null>(null);
  ConfirmMode = ConfirmMode;

  ngOnInit(): void {
    this.loadPage();
    this.loadLookups();
  }

  loadPage(): void {
    this.api.findAll(this.currentPage(), this.PAGE_SIZE, this.searchQuery(), this.activeFilter(), this.typeFilter())
      .subscribe({
        next: (page) => {
          this._trabajadores.set(page.data);
          this.totalFiltered.set(page.totalFiltered);
          this._stats.set(page.stats);
        },
        error: () => this.toast.show('error', '✗ No se pudieron cargar los datos.')
      });
  }

  loadLookups(): void {
    this.api.getProvincias().subscribe({ next: (data) => this.provincias.set(data) });
    this.api.getLocalidades().subscribe({ next: (data) => this.localidades.set(data) });
    this.api.getSeleccionadoresLookup().subscribe({ next: (data) => this.seleccionadores.set(data) });
    this.api.getTiposDoc().subscribe({ next: (data) => this.tiposDoc.set(data) });
  }

  getById(id: number): Trabajador | undefined {
    return this._trabajadores().find(t => t.id === id);
  }

  // Listas para validación UI de unicidad
  readonly existingEmails = computed(() => {
    return this._trabajadores().map(t => t.email?.toLowerCase()).filter(Boolean) as string[];
  });
  readonly existingDnis = computed(() => {
    return this._trabajadores().map(t => t.dni_nif_pasaporte?.trim()).filter(Boolean) as string[];
  });

  onSearchChange(q: string): void { this.searchQuery.set(q); this.currentPage.set(1); this.loadPage(); }
  onFilterChange(f: TrabFilterType): void { this.activeFilter.set(f); this.currentPage.set(1); this.loadPage(); }
  onTypeFilterChange(t: TrabFilterTipoType): void { this.typeFilter.set(t); this.currentPage.set(1); this.loadPage(); }
  onPageChange(page: number): void { this.currentPage.set(page); this.loadPage(); }

  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'view': this.onDetailClick(event.id); break;
      case 'edit': this.onEditClick(event.id); break;
      case 'baja': this.onBajaClick(event.id); break;
      case 'activar': this.onActivarClick(event.id); break;
    }
  }

  openAdd(): void {
    this.selectedId.set(null);
    this.selectedTrabajador = null;
    this.showForm = true;
  }

  onDetailClick(id: number): void {
    this.selectedId.set(id);
    this.selectedTrabajador = this.getById(id) ?? null;
    this.detailAsignaciones.set([]);
    this.detailFormaciones.set([]);
    this.detailDocumentos.set([]);
    this.api.getAsignacionesByTrabajador(id).subscribe({
      next: (data) => this.detailAsignaciones.set(data)
    });
    this.api.getFormacionesByTrabajador(id).subscribe({
      next: (data) => this.detailFormaciones.set(data)
    });
    this.api.getDocumentosByTrabajador(id).subscribe({
      next: (data) => this.detailDocumentos.set(data)
    });
    this.showDetail = true;
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.selectedTrabajador = this.getById(id) ?? null;
    this.showForm = true;
  }

  onSaveForm(data: any): void {
    const editId = this.selectedId();
    if (editId != null) {
      this.api.update(editId, data).subscribe({
        next: () => {
          this.toast.show('info', `✎ Trabajador actualizado`);
          this.closeModals(); this.loadPage();
        },
        error: () => this.toast.show('error', '✗ Error al actualizar')
      });
    } else {
      this.api.create(data).subscribe({
        next: () => {
          this.toast.show('success', `✓ Trabajador añadido`);
          this.closeModals(); this.currentPage.set(1); this.loadPage();
        },
        error: () => this.toast.show('error', '✗ Error al crear')
      });
    }
  }

  onImportCsv(rows: any[]): void {
    let success = 0;
    let errors = 0;
    
    const importNext = (index: number) => {
      if (index >= rows.length) {
        this.toast.show(errors === 0 ? 'success' : 'warning', `Importación finalizada. ${success} correctos, ${errors} errores.`);
        this.loadPage();
        return;
      }
      
      const row = rows[index];
      const { id, created_at, updated_at, seleccionador_nombre, provincia_nombre, localidad_nombre, asignado, ...cleanRow } = row;
      
      const payload = {
        ...cleanRow,
        activo: cleanRow.activo === 'true' || cleanRow.activo === true || cleanRow.activo === 1 || cleanRow.activo === '1',
        freelance: cleanRow.freelance === 'true' || cleanRow.freelance === true || cleanRow.freelance === 1 || cleanRow.freelance === '1',
        salario: cleanRow.salario ? Number(cleanRow.salario) : null,
        cheques_guarderia: cleanRow.cheques_guarderia ? Number(cleanRow.cheques_guarderia) : null,
        cheques_restaurante: cleanRow.cheques_restaurante ? Number(cleanRow.cheques_restaurante) : null,
        id_seleccionadores: cleanRow.id_seleccionadores ? Number(cleanRow.id_seleccionadores) : null,
        id_localidad: cleanRow.id_localidad ? Number(cleanRow.id_localidad) : null,
        id_provincia: cleanRow.id_provincia ? Number(cleanRow.id_provincia) : null,
      };

      this.api.create(payload).subscribe({
        next: () => { success++; importNext(index + 1); },
        error: () => { errors++; importNext(index + 1); }
      });
    };
    
    if (rows.length > 0) {
      importNext(0);
    }
  }

  closeModals(): void {
    this.showForm = false;
    this.showDetail = false;
    this.selectedId.set(null);
    this.selectedTrabajador = null;
    this.detailAsignaciones.set([]);
    this.detailFormaciones.set([]);
    this.detailDocumentos.set([]);
  }

  onBajaClick(id: number): void {
    this.selectedId.set(id);
    this.confirmMode = ConfirmMode.DESACTIVAR;
    const t = this.getById(id);
    this.selectedTrabajadorNombre.set(t ? `${t.nombre} ${t.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onActivarClick(id: number): void {
    this.selectedId.set(id);
    this.confirmMode = ConfirmMode.ACTIVAR;
    const t = this.getById(id);
    this.selectedTrabajadorNombre.set(t ? `${t.nombre} ${t.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onConfirmToggle(): void {
    if (this.confirmMode === ConfirmMode.ELIMINAR && this.selectedDocumentoToDelete) {
      this.api.deleteDocumento(this.selectedDocumentoToDelete.id).subscribe({
        next: () => {
          this.toast.show('success', '✓ Documento eliminado');
          this.showConfirm = false;
          this.confirmCustomTitle.set(undefined);
          this.confirmCustomDesc.set(null);
          this.selectedDocumentoToDelete = null;
          this.api.getDocumentosByTrabajador(this.selectedId()!).subscribe(data => this.detailDocumentos.set(data));
        },
        error: () => this.toast.show('error', '✗ Error al eliminar')
      });
      return;
    }

    const confirmId = this.selectedId();
    if (confirmId == null) return;
    const t = this.getById(confirmId)!;
    const wasActive = t.activo;
    
    this.api.toggleStatus(confirmId).subscribe({
      next: () => {
        this.showConfirm = false; this.selectedId.set(null);
        if (wasActive) this.toast.show('warning', `⊘ Trabajador dado de baja`);
        else this.toast.show('success', `↺ Trabajador reactivado`);
        this.loadPage();
      },
      error: () => this.toast.show('error', '✗ Error al cambiar el estado')
    });
  }

  // ── GESTIÓN DOCUMENTAL ───────────────────────────────────────────────────────
  onViewDoc(doc: any): void {
    // Si tienes un base64 o una URL directa del backend
    if (doc.doc) {
      // Simular apertura en nueva pestaña si es base64 
      // o redirigir si el backend devuelve un endpoint de visualización
      const w = window.open();
      if (w) w.document.write(`<iframe width="100%" height="100%" src="data:application/pdf;base64,${doc.doc}"></iframe>`);
    } else {
      this.toast.show('warning', 'Visualización no disponible');
    }
  }

  onDownloadDoc(doc: any): void {
    if (doc.doc) {
      const a = document.createElement('a');
      a.href = `data:application/octet-stream;base64,${doc.doc}`;
      a.download = doc.nombre_fichero || 'documento';
      a.click();
    } else {
      this.toast.show('warning', 'Descarga no disponible');
    }
  }

  onDeleteDoc(doc: any): void {
    this.selectedDocumentoToDelete = doc;
    this.confirmMode = ConfirmMode.ELIMINAR;
    this.selectedTrabajadorNombre.set(doc.nombre_fichero || 'este documento');
    this.confirmCustomTitle.set('¿Eliminar documento?');
    this.confirmCustomDesc.set(doc.nombre_fichero || 'este documento');
    this.showConfirm = true;
  }

  onUploadNewDoc(data: any): void {
    const payload = {
      ...data,
      id_trabajador: this.selectedId()
    };
    this.api.uploadDocumento(payload).subscribe({
      next: () => {
        this.toast.show('success', '✓ Documento añadido');
        this.api.getDocumentosByTrabajador(this.selectedId()!).subscribe(res => this.detailDocumentos.set(res));
      },
      error: () => this.toast.show('error', '✗ Error al añadir documento')
    });
  }

  onUpdateDoc(data: any): void {
    this.api.updateDocumento(data).subscribe({
      next: () => {
        this.toast.show('info', '✎ Documento actualizado');
        this.api.getDocumentosByTrabajador(this.selectedId()!).subscribe(res => this.detailDocumentos.set(res));
      },
      error: () => this.toast.show('error', '✗ Error al actualizar documento')
    });
  }
}
