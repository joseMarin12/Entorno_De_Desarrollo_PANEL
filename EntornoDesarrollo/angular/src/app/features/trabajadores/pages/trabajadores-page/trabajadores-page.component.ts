import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrabajadoresApiService, TrabajadorStats } from '../../../../services/trabajadores-api.service';
import { DocumentosService } from '../../../../services/documentos.service';
import { ToastService } from '../../../../services/toast.service';
import { Trabajador, TrabajadorFormData } from '../../../../models/trabajador.model';
import { DocFile, DocumentoSubida, TipoDocLookup } from '../../../../models/firma.model';
import { TrabStatsRowComponent } from '../../components/stats-row/trab-stats-row.component';
import { TrabToolbarComponent, TrabFilterType, TrabFilterTipoType } from '../../components/toolbar/trab-toolbar.component';
import { TrabModalFormComponent } from '../../components/modal-form/trab-modal-form.component';
import { TrabModalDetailComponent } from '../../components/modal-detail/trab-modal-detail.component';
import { TrabModalFirmaComponent } from '../../components/modal-firma/trab-modal-firma.component';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { TableComponent } from '../../../../shared/table/table.component';
import { TRABAJADORES_COLUMNS } from './trabajadores-table.config';

@Component({
  selector: 'app-trabajadores-page',
  standalone: true,
  imports: [
    CommonModule, TrabStatsRowComponent, TrabToolbarComponent, TableComponent,
    TrabModalFormComponent, TrabModalDetailComponent, TrabModalFirmaComponent,
    TopbarComponent, ConfirmationModalComponent
  ],
  templateUrl: './trabajadores-page.component.html',
  styles: [`
    :host ::ng-deep app-table .table-card {
      overflow-x: auto;
    }
    :host ::ng-deep app-table table {
      min-width: max-content;
    }
    :host ::ng-deep app-table .pagination {
      position: sticky;
      left: 0;
    }
  `],
})
export class TrabajadoresPageComponent implements OnInit, OnDestroy {
  api = inject(TrabajadoresApiService);
  docsApi = inject(DocumentosService);
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
  readonly tiposDoc = signal<TipoDocLookup[]>([]);

  // Datos de relaciones para el modal de detalle
  readonly detailAsignaciones = signal<any[]>([]);
  readonly detailFormaciones = signal<any[]>([]);
  readonly detailDocs = signal<DocFile[]>([]);
  readonly previewBase64 = signal<string | null>(null);
  readonly firmaPreviewBase64 = signal<string | null>(null);
  readonly firmaEnviando = signal(false);

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

  showForm = false;
  showConfirm = false;
  showDetail = false;
  showFirma = false;
  selectedFirma = signal<any | null>(null);
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
    this.docsApi.getTiposDoc().subscribe({ next: (data) => this.tiposDoc.set(data) });
  }

  private getById(id: number): Trabajador | undefined {
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
    this.detailDocs.set([]);
    this.api.getAsignacionesByTrabajador(id).subscribe({
      next: (data) => this.detailAsignaciones.set(data)
    });
    this.api.getFormacionesByTrabajador(id).subscribe({
      next: (data) => this.detailFormaciones.set(data)
    });
    this.loadDetailDocs(id);
    this.showDetail = true;
  }

  private loadDetailDocs(trabajadorId: number): void {
    this.docsApi.getByTrabajador(trabajadorId).subscribe({
      next: (data) => {
        this.detailDocs.set(data);
        this.seedFirmasSnapshot();
        this.arrancarPollingSiHayFirmas();
      }
    });
  }

  /** Recarga los documentos del trabajador abierto (tras crear / editar / firmar / cancelar). */
  private reloadDetailDocs(): void {
    const id = this.selectedId();
    if (id != null) this.loadDetailDocs(id);
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.selectedTrabajador = this.getById(id) ?? null;
    this.showForm = true;
  }

  onSaveForm(data: TrabajadorFormData): void {
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

  closeModals(): void {
    this.showForm = false;
    this.showDetail = false;
    this.selectedId.set(null);
    this.selectedTrabajador = null;
    this.detailAsignaciones.set([]);
    this.detailFormaciones.set([]);
    this.detailDocs.set([]);
    this.previewBase64.set(null);
    this.pararPolling();
    this.firmasSnapshot.clear();
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
      this.docsApi.remove(this.selectedDocumentoToDelete.id).subscribe({
        next: () => {
          this.toast.show('success', '✓ Documento eliminado');
          this.showConfirm = false;
          this.confirmCustomTitle.set(undefined);
          this.confirmCustomDesc.set(null);
          this.selectedDocumentoToDelete = null;
          this.reloadDetailDocs();
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

  //GESTIÓN DOCUMENTAL
  onDownloadDoc(doc: any): void {

    this.docsApi.getArchivo(doc.id).subscribe({
      next: (res) => {
        const b64 = res?.contenido_b64;
        if (!b64) { this.toast.show('warning', 'Descarga no disponible'); return; }
        const a = document.createElement('a');
        a.href = `data:application/octet-stream;base64,${b64}`;
        a.download = doc.nombre_fichero || 'documento';
        a.click();
      },
      error: () => this.toast.show('error', '✗ Error al descargar el documento')
    });
  }
  onPreviewArchivo(doc: any): void {
    this.previewBase64.set(null);
    this.docsApi.getArchivo(doc.id).subscribe({
      next: (res) => this.previewBase64.set(res?.contenido_b64 ?? null),
      error: () => this.toast.show('error', '✗ No se pudo cargar la previsualización')
    });
  }

  onPreviewArchivoFirma(firma: any): void {
    this.firmaPreviewBase64.set(null);
    const docId = firma?.doc_id;
    if (!docId) { this.toast.show('warning', 'Documento no disponible'); return; }
    this.docsApi.getArchivo(docId).subscribe({
      next: (res) => this.firmaPreviewBase64.set(res?.contenido_b64 ?? null),
      error: () => this.toast.show('error', '✗ No se pudo cargar la previsualización')
    });
  }

  onDeleteDoc(doc: any): void {
    this.selectedDocumentoToDelete = doc;
    this.confirmMode = ConfirmMode.ELIMINAR;
    this.selectedTrabajadorNombre.set(doc.nombre_fichero || 'este documento');
    this.confirmCustomTitle.set('¿Eliminar documento?');
    this.confirmCustomDesc.set(doc.nombre_fichero || 'este documento');
    this.showConfirm = true;
  }

  onUploadNewDoc(data: DocumentoSubida): void {
    const payload = { ...data, id_trabajador: this.selectedId() };
    this.docsApi.create(payload).subscribe({
      next: () => {
        this.toast.show('success', '✓ Documento añadido');
        this.reloadDetailDocs();
      },
      error: () => this.toast.show('error', '✗ Error al añadir documento')
    });
  }

  onUpdateDoc(data: any): void {
    this.docsApi.update(data).subscribe({
      next: () => {
        this.toast.show('info', '✎ Documento actualizado');
        this.reloadDetailDocs();
      },
      error: () => this.toast.show('error', '✗ Error al actualizar documento')
    });
  }

  //POLLING DEL DETALLE
  private detallePollHandle: ReturnType<typeof setInterval> | null = null;
  private readonly DETALLE_POLL_MS = 10000;
  private firmasSnapshot = new Map<number, { estado: string; fechaTrab: string | null; fechaRrhh: string | null }>();
  private get tieneFirmasEnCurso(): boolean {
    return this.detailDocs().some(d => d.firma?.estado === 'EN_SINATURA');
  }
  private seedFirmasSnapshot(): void {
    this.firmasSnapshot.clear();
    for (const d of this.detailDocs()) {
      if (d.firma) {
        this.firmasSnapshot.set(d.id, {
          estado: d.firma.estado,
          fechaTrab: d.firma.fecha_firma_trabajador ?? null,
          fechaRrhh: d.firma.fecha_firma_rrhh ?? null
        });
      }
    }
  }

  private arrancarPollingSiHayFirmas(): void {
    this.pararPolling();
    if (!this.tieneFirmasEnCurso) return;
    this.detallePollHandle = setInterval(() => this.refrescarDetalle(), this.DETALLE_POLL_MS);
  }

  private pararPolling(): void {
    if (this.detallePollHandle) {
      clearInterval(this.detallePollHandle);
      this.detallePollHandle = null;
    }
  }

  private refrescarDetalle(): void {
    const trabId = this.selectedId();
    if (trabId == null) { this.pararPolling(); return; }
    this.docsApi.getByTrabajador(trabId).subscribe({
      next: (docs) => {
        if (!this.showDetail || this.selectedId() !== trabId) return;
        this.detectarYAvisarTransiciones(docs);
        this.detailDocs.set(docs);
        this.refrescarFirmaAbierta(docs);
        this.seedFirmasSnapshot();
        if (!this.tieneFirmasEnCurso) this.pararPolling();
      }
    });
  }

  private refrescarFirmaAbierta(docs: DocFile[]): void {
    if (!this.showFirma) return;
    const current = this.selectedFirma();
    if (!current) return;
    const doc = docs.find(d => d.id === current.doc_id);
    if (!doc?.firma) return;
    this.selectedFirma.set({
      id: doc.firma.id,
      doc_id: doc.id,
      nombre_fichero: doc.nombre_fichero,
      id_tipo_documento: doc.tipo_id,
      tipo_nombre: doc.tipo_nombre,
      estado: doc.firma.estado,
      fecha_asignacion: doc.firma.fecha_asignacion,
      sinatura_id: doc.firma.sinatura_id,
      requiere_firma_rrhh: doc.firma.requiere_firma_rrhh,
      email_segundo_firmante: doc.firma.email_segundo_firmante,
      motivo: doc.firma.motivo,
      fecha_envio: doc.firma.fecha_envio,
      fecha_firma_trabajador: doc.firma.fecha_firma_trabajador,
      fecha_firma_rrhh: doc.firma.fecha_firma_rrhh,
      fecha_completado: doc.firma.fecha_completado
    });
  }

  private detectarYAvisarTransiciones(docs: DocFile[]): void {
    const trab = this.selectedTrabajador
      ? `${this.selectedTrabajador.nombre} ${this.selectedTrabajador.primer_apellido}`.trim()
      : 'el trabajador';
    for (const d of docs) {
      if (!d.firma) continue;
      const prev = this.firmasSnapshot.get(d.id);
      if (!prev) continue;
      const tipo = d.tipo_nombre || d.nombre_fichero || 'documento';
      if (prev.estado === 'EN_SINATURA' && d.firma.estado !== 'EN_SINATURA') {
        if (d.firma.estado === 'COMPLETADO') {
          this.toast.show('success', `✅ "${tipo}" firmado correctamente`);
        } else if (d.firma.estado === 'RECHAZADO') {
          this.toast.show('error', `✗ Firma rechazada · ${d.firma.motivo || 'sin motivo'}`);
        } else if (d.firma.estado === 'CANCELADO') {
          this.toast.show('warning', `⊘ Firma cancelada · ${d.firma.motivo || 'sin motivo'}`);
        }
        continue;
      }
      if (prev.estado === 'EN_SINATURA' && d.firma.estado === 'EN_SINATURA') {
        if (!prev.fechaTrab && d.firma.fecha_firma_trabajador) {
          this.toast.show('info', `👤 ${trab} firmó "${tipo}"`);
        }
        if (!prev.fechaRrhh && d.firma.fecha_firma_rrhh) {
          this.toast.show('info', `👤 RRHH firmó "${tipo}"`);
        }
      }
    }
  }

  // GESTIÓN DE FIRMAS
  onOpenFirma(firma: any | null): void {
    this.firmaEnviando.set(false);
    this.selectedFirma.set(firma);
    this.showFirma = true;
  }

  onCloseFirma(): void {
    this.showFirma = false;
    this.selectedFirma.set(null);
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  onSaveFirma(payload: any): void {
    if (payload.estado === 'COMPLETADO') {
      this.onDownloadDoc({ id: payload.doc_id, nombre_fichero: this.selectedFirma()?.nombre_fichero });
      return;
    }
    this.firmaEnviando.set(true);
    this.docsApi.enviarFirma(payload).subscribe({
      next: () => {
        this.firmaEnviando.set(false);
        this.toast.show('success', '✓ Documento enviado a firma');
        this.onCloseFirma();
        this.reloadDetailDocs();
      },
      error: () => {
        this.firmaEnviando.set(false);
        this.toast.show('error', '✗ Error al enviar a firma');
      }
    });
  }

  onCancelarFirma(payload: any): void {
    this.firmaEnviando.set(true);
    this.docsApi.cancelarFirma(payload).subscribe({
      next: () => {
        this.firmaEnviando.set(false);
        this.toast.show('info', 'Firma cancelada');
        this.onCloseFirma();
        this.reloadDetailDocs();
      },
      error: () => {
        this.firmaEnviando.set(false);
        this.toast.show('error', '✗ Error al cancelar la firma');
      }
    });
  }

  onEliminarDocDesdeFirma(payload: { doc_id?: number; nombre_fichero?: string | null }): void {
    this.onCloseFirma();
    this.onDeleteDoc({ id: payload.doc_id, nombre_fichero: payload.nombre_fichero });
  }
}
