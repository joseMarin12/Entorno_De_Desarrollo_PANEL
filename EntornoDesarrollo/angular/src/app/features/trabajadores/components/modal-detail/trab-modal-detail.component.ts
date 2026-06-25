import { Component, EventEmitter, Input, OnDestroy, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trabajador, getColorFor, getInitials } from '../../../../models/trabajador.model';
import {
  FirmaInfo, DocFile, DocumentoSubida,
  estadoFirmaLabel, estadoFirmaCssClass
} from '../../../../models/firma.model';
import { DocPreviewModalComponent } from '../../../../shared/doc-preview-modal/doc-preview-modal.component';
import { DocUploadFormComponent, NuevoDocumento } from '../doc-upload-form/doc-upload-form.component';

@Component({
  selector: 'app-trab-modal-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DocPreviewModalComponent, DocUploadFormComponent],
  templateUrl: './trab-modal-detail.component.html',
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .detail-item { margin-bottom: 0; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
    .detail-value { font-size: 14px; color: var(--text); font-weight: 500; }

    .avatar-large {
      width: 60px; height: 60px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }

    .empty-dash { color: #a1a1aa; font-weight: 400; }

    .section-box {
      background: #f8f9fd;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 20px;
    }
    .section-box-title {
      font-size: 12px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 16px; display: block;
    }

    .tabs-nav {
      display: flex;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
      gap: 6px;
      position: relative;
      width: 100%;
    }
    .tab-item {
      position: relative;
      padding: 12px 10px 14px;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      border-radius: 8px 8px 0 0;
      user-select: none;
      white-space: nowrap;
      flex: 1 1 0;
      min-width: 0;
      min-height: 64px;
    }
    .tab-item:hover {
      color: var(--text);
      background-color: #f8f9fd;
    }
    .tab-item.active {
      color: var(--purple-dark);
    }
    .tab-item.active::after {
      content: '';
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: -1px;
      height: 2.5px;
      background: var(--purple-dark);
      border-radius: 2px 2px 0 0;
      animation: tab-underline-in 0.25s ease-out;
    }
    @keyframes tab-underline-in {
      from { transform: scaleX(0.4); opacity: 0; }
      to { transform: scaleX(1); opacity: 1; }
    }
    .tab-label {
      line-height: 1;
      text-align: center;
    }
    .tab-count {
      background: #eef0fa;
      color: var(--purple-dark);
      border-radius: 999px;
      padding: 1px 8px;
      font-size: 10.5px;
      font-weight: 700;
      min-width: 20px;
      text-align: center;
      line-height: 1.5;
      transition: background-color 0.2s ease;
    }
    .tab-item.active .tab-count {
      background: var(--purple-dark);
      color: #fff;
    }

    .empty-tab {
      padding: 40px 20px; text-align: center; color: var(--text-muted);
      background: #f9fafb; border-radius: 12px; border: 1px dashed var(--border);
    }
    .empty-tab svg { margin-bottom: 12px; opacity: 0.4; }
    .empty-tab h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
    .empty-tab p { font-size: 12px; }

    /* Métricas de firma */
    .firma-metrics {
      display: flex; gap: 10px; flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .firma-metric {
      flex: 1; min-width: 130px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .firma-metric-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .firma-metric-dot.pendiente { background: #94a3b8; }
    .firma-metric-dot.proceso { background: #f59e0b; }
    .firma-metric-dot.completado { background: #10b981; }
    .firma-metric-value {
      font-size: 18px; font-weight: 800; color: var(--text); line-height: 1;
    }
    .firma-metric-label {
      font-size: 11px; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600;
      margin-top: 2px;
    }

    /* Badge de estado */
    .estado-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.3px;
    }
    .estado-badge.pendiente { background: #f1f5f9; color: #475569; }
    .estado-badge.proceso { background: #fef3c7; color: #92400e; }
    .estado-badge.completado { background: #d1fae5; color: #065f46; }
    .estado-badge .dot {
      width: 6px; height: 6px; border-radius: 50%;
    }
    .estado-badge.pendiente .dot { background: #94a3b8; }
    .estado-badge.proceso .dot { background: #f59e0b; }
    .estado-badge.completado .dot { background: #10b981; }

    /* Indicador RRHH */
    .rrhh-pill {
      display: inline-flex; align-items: center; gap: 4px;
      background: #ede9fe; color: var(--purple-dark);
      padding: 2px 8px; border-radius: 20px;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.3px;
    }

    /* Card de firma */
    .firma-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 14px;
      transition: background-color 0.45s ease-out, border-color 0.45s ease-out, box-shadow 0.2s;
    }
    .firma-card:hover {
      border-color: #c7d2fe;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    /* Tarjeta resaltada tras navegar desde el badge de estado */
    .firma-card.highlighted {
      background-color: #faf5ff;
      border-color: #e9d5ff;
    }
    .firma-icon {
      width: 40px; height: 40px;
      background: #ede9fe; color: var(--purple-dark);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .firma-title {
      font-size: 14px; font-weight: 600; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .firma-sub {
      font-size: 12px; color: var(--text-muted);
      display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
      margin-top: 2px;
    }
    .firma-action-btn {
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px; font-weight: 600;
      border: 1px solid var(--border);
      background: #fff; color: var(--text);
      cursor: pointer; transition: all 0.2s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .firma-action-btn:hover { background: #f9fafb; }
    .firma-action-btn.primary {
      background: var(--purple-dark);
      color: #fff;
      border-color: var(--purple-dark);
    }
    .firma-action-btn.primary:hover { opacity: 0.92; }

    /* Card archivada bloqueada */
    .doc-card-blocked {
      opacity: 0.7;
      background: #f9fafb !important;
      border-style: dashed !important;
    }
    .doc-card-blocked .doc-icon-wrap {
      background: #e5e7eb !important;
      color: #9ca3af !important;
    }
    .doc-card-blocked .doc-title {
      color: #6b7280 !important;
    }
    /* Badge de estado clickeable (lleva a pestaña Firmas) */
    .estado-badge.clickable {
      cursor: pointer;
      user-select: none;
      transition: filter 0.18s, transform 0.18s, box-shadow 0.18s;
    }
    .estado-badge.clickable:hover {
      filter: brightness(0.97);
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .estado-badge.clickable:active {
      transform: translateY(0);
    }

    /* Header de la lista: título arriba, toolbar (buscador + filtro) debajo */
    .docs-list-header {
      display: flex; flex-direction: column; gap: 10px;
      margin-bottom: 14px;
    }
    .docs-list-title {
      font-size: 12px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.4px;
    }
    .docs-toolbar {
      display: flex; align-items: center; gap: 10px;
    }
    .doc-search-wrap {
      position: relative; flex: 1; min-width: 0;
    }
    .doc-search-icon {
      position: absolute; left: 10px; top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted); pointer-events: none;
    }
    .doc-search-input {
      width: 100%; box-sizing: border-box;
      padding: 7px 30px 7px 32px;
      font-size: 13px; font-family: inherit;
      border: 1px solid var(--border); border-radius: 8px;
      background: #fff; color: var(--text);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .doc-search-input::placeholder { color: #9ca3af; }
    .doc-search-input:focus {
      outline: none;
      border-color: #cbd5e1;
    }
    .doc-search-clear {
      position: absolute; right: 5px; top: 50%;
      transform: translateY(-50%);
      width: 22px; height: 22px;
      border: none; background: transparent;
      color: var(--text-muted); cursor: pointer;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .doc-search-clear:hover {
      background: #f3f4f6; color: var(--text);
    }

    /* Dropdown de filtro por estado */
    .doc-status-wrap {
      position: relative; flex-shrink: 0;
    }
    .doc-status-filter {
      height: 34px; box-sizing: border-box;
      padding: 0 32px 0 12px;
      font-size: 13px; font-family: inherit;
      border: 1px solid var(--border); border-radius: 8px;
      background: #fff; color: var(--text);
      cursor: pointer;
      appearance: none; -webkit-appearance: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 180px;
    }
    .doc-status-filter:focus {
      outline: none;
      border-color: #cbd5e1;
    }
    .doc-status-chevron {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    /* ── Bloque "Reemplazar archivo" en edición inline ── */
    .btn-replace-file {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 7px 14px;
      font-size: 12px; font-weight: 600;
      color: #4338ca;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .btn-replace-file:hover {
      background: #e0e7ff;
      border-color: #a5b4fc;
      color: #3730a3;
    }
    .replace-file-name {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text); font-weight: 500;
      padding: 5px 10px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 6px;
      max-width: 200px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .replace-file-name svg { color: #6366f1; flex-shrink: 0; }
    .replace-file-empty {
      font-size: 12px; color: var(--text-muted); font-style: italic;
    }
    .replace-file-locked {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 12px; color: #6b7280;
      padding: 6px 12px;
      background: #f9fafb;
      border: 1px dashed #d1d5db;
      border-radius: 8px;
    }
    .replace-file-locked svg { color: #9ca3af; flex-shrink: 0; }

    /* Acciones cuando el doc está pendiente de envío o rechazado */
    .doc-pendiente-actions {
      display: flex; align-items: center; gap: 8px;
    }
    .btn-doc-eliminar,
    .btn-doc-enviar {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600;
      padding: 7px 12px; border-radius: 8px;
      cursor: pointer; white-space: nowrap;
      transition: background 0.2s, border-color 0.2s, opacity 0.2s;
    }
    .btn-doc-eliminar {
      color: #b91c1c;
      background: #fee2e2;
      border: 1px solid #fecaca;
    }
    .btn-doc-eliminar:hover {
      background: #fecaca;
      border-color: #fca5a5;
    }
    .btn-doc-enviar {
      color: #fff;
      background: var(--purple-dark);
      border: 1px solid var(--purple-dark);
    }
    .btn-doc-enviar:hover { opacity: 0.92; }

    /* Estado rechazado */
    .estado-badge.rechazado { background: #fee2e2; color: #991b1b; }
    .estado-badge.rechazado .dot { background: #ef4444; }
    .firma-metric-dot.rechazado { background: #ef4444; }

    /* Estado cancelado (terminal por anulación de RRHH): gris/neutro, no rojo */
    .estado-badge.cancelado { background: #f1f5f9; color: #475569; }
    .estado-badge.cancelado .dot { background: #94a3b8; }
    .firma-metric-dot.cancelado { background: #94a3b8; }
  `]
})
export class TrabModalDetailComponent implements OnDestroy {

  @Input({ required: true }) trabajador!: Trabajador;
  @Input() asignaciones: any[] = [];
  @Input() formaciones: any[] = [];
  @Input() tiposDoc: {id: number, tipo: string}[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<number>();

  @Output() downloadDoc = new EventEmitter<any>();
  @Output() deleteDoc = new EventEmitter<any>();
  @Output() uploadNewDoc = new EventEmitter<DocumentoSubida>();
  @Output() updateDoc = new EventEmitter<any>();
  @Output() requestPreviewArchivo = new EventEmitter<DocFile>();

  @Input() previewBase64: string | null = null;


  @Output() openFirma = new EventEmitter<any | null>();
  activeTab = signal<'datos' | 'asignaciones' | 'formaciones' | 'documentos' | 'firmas'>('datos');
  private _docs = signal<DocFile[]>([]);
  @Input() set docs(value: DocFile[]) { this._docs.set(value ?? []); }


  firmas = computed(() =>
    this._docs()
      .filter((d): d is DocFile & { firma: FirmaInfo } =>
        d.firma !== null && d.firma.estado !== 'PENDIENTE_ENVIO'
      )
      .map(d => ({
        id: d.firma.id,
        doc_id: d.id,
        nombre_fichero: d.nombre_fichero,
        id_tipo_documento: d.tipo_id,
        tipo_nombre: d.tipo_nombre,
        estado: d.firma.estado,
        fecha_asignacion: d.firma.fecha_asignacion,
        sinatura_id: d.firma.sinatura_id,
        requiere_firma_rrhh: d.firma.requiere_firma_rrhh,
        email_segundo_firmante: d.firma.email_segundo_firmante,
        motivo: d.firma.motivo,
        fecha_envio: d.firma.fecha_envio,
        fecha_firma_trabajador: d.firma.fecha_firma_trabajador,
        fecha_firma_rrhh: d.firma.fecha_firma_rrhh,
        fecha_completado: d.firma.fecha_completado
      }))
  );

  // Pestaña Documentos
  archivados = computed(() => this._docs());
  docSearchQuery = signal<string>('');
  docStatusFilter = signal<'todos' | 'sin_firma' | 'pendiente' | 'en_firma' | 'firmado' | 'rechazado' | 'cancelado'>('todos');

  archivadosFiltrados = computed(() => {
    const q = this.docSearchQuery().trim().toLowerCase();
    const status = this.docStatusFilter();
    return this.archivados().filter(d => {

      if (status === 'sin_firma' && d.firma !== null) return false;
      if (status === 'pendiente' && d.firma?.estado !== 'PENDIENTE_ENVIO') return false;
      if (status === 'en_firma' && d.firma?.estado !== 'EN_SINATURA') return false;
      if (status === 'firmado' && d.firma?.estado !== 'COMPLETADO') return false;
      if (status === 'rechazado' && d.firma?.estado !== 'RECHAZADO') return false;
      if (status === 'cancelado' && d.firma?.estado !== 'CANCELADO') return false;
      if (!q) return true;
      return (d.nombre_fichero ?? '').toLowerCase().includes(q) ||
             (d.tipo_nombre ?? '').toLowerCase().includes(q) ||
             (d.descripcion ?? '').toLowerCase().includes(q);
    });
  });

  get tieneFiltrosActivos(): boolean {
    return !!this.docSearchQuery() || this.docStatusFilter() !== 'todos';
  }

  limpiarFiltrosDocs(): void {
    this.docSearchQuery.set('');
    this.docStatusFilter.set('todos');
  }

  puedeEliminarOEnviar(doc: any): boolean {
    return !!doc.firma && doc.firma.estado === 'PENDIENTE_ENVIO';
  }

  onEnviarFirmaDesdeDoc(doc: DocFile): void {
    if (!doc.firma) return;
    this.openFirma.emit({
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

  // Visor del documento
  previewDoc = signal<DocFile | null>(null);

  abrirPreviewDoc(doc: DocFile): void {
    this.previewDoc.set(doc);
    this.requestPreviewArchivo.emit(doc);
  }

  cerrarPreviewDoc(): void {
    this.previewDoc.set(null);
  }

  get previewMeta(): string {
    const d = this.previewDoc();
    if (!d) return '';
    const fecha = d.fecha_creacion
      ? new Date(d.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    return [d.tipo_nombre, fecha].filter(Boolean).join(' · ');
  }

  editingDocId: number | null = null;
  editDocDesc = '';
  editDocFile: File | null = null;
  colorFor = getColorFor;
  initials = getInitials;

  get statusLabel(): string { return this.trabajador.activo ? 'Activo' : 'De baja'; }
  get tipoLabel(): string { return this.trabajador.freelance ? 'Freelance' : 'Plantilla'; }

  get totalFormaciones(): number { return this.formaciones.length; }
  get totalAsignaciones(): number { return this.asignaciones.length; }
  get totalDocumentos(): number { return this.archivados().length; }
  get totalFirmas(): number { return this.firmas().length; }

  // ── Métricas de estado de firmas
  get firmasEnProceso(): number {
    return this.firmas().filter(f => f.estado === 'EN_SINATURA').length;
  }
  get firmasCompletadas(): number {
    return this.firmas().filter(f => f.estado === 'COMPLETADO').length;
  }
  get firmasRechazadas(): number {
    return this.firmas().filter(f => f.estado === 'RECHAZADO').length;
  }
  get firmasCanceladas(): number {
    return this.firmas().filter(f => f.estado === 'CANCELADO').length;
  }


  isDocBloqueado(doc: any): boolean {
    return !!doc.firma && doc.firma.estado !== 'COMPLETADO';
  }

  estadoLabel = estadoFirmaLabel;
  estadoCssClass = estadoFirmaCssClass;

  onAbrirFirma(firma: any): void { this.openFirma.emit(firma); }

  setTab(tab: 'datos' | 'asignaciones' | 'formaciones' | 'documentos' | 'firmas') {
    this.activeTab.set(tab);
    this.cancelEdit();
  }
  highlightedDocId = signal<number | null>(null);
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly HIGHLIGHT_DURATION_MS = 2500;


  goToFirma(docId: number): void {
    this.setTab('firmas');
    this.highlightedDocId.set(docId);

    // Espera al render del nuevo tab antes de hacer scroll.
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-firma-doc-id="${docId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => {
      this.highlightedDocId.set(null);
      this.highlightTimer = null;
    }, this.HIGHLIGHT_DURATION_MS);
  }

  ngOnDestroy(): void {
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
  }

  // ── Subida de documentos

  onDocAdded(doc: NuevoDocumento): void {
    this.uploadNewDoc.emit({
      origen: 'subir',
      tipoId: doc.tipoId,
      descripcion: doc.descripcion,
      requiere_firma: doc.requiereFirma,
      fileName: doc.file.name,
      base64: doc.base64.split(',')[1],
    });
  }

  // ── Métodos para edición inline ────────────────────────────────────────────
  startEdit(doc: any): void {
    this.editingDocId = doc.id;
    this.editDocDesc = doc.descripcion || '';
    this.editDocFile = null;
  }

  cancelEdit(): void {
    this.editingDocId = null;
    this.editDocDesc = '';
    this.editDocFile = null;
  }

  onEditFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.editDocFile = file;
  }

  saveEdit(doc: any): void {
    const puedeReemplazarArchivo = !doc.firma && !!this.editDocFile;
    if (puedeReemplazarArchivo) {
      const reader = new FileReader();
      reader.readAsDataURL(this.editDocFile!);
      reader.onload = () => {
        this.updateDoc.emit({
          id: doc.id,
          descripcion: this.editDocDesc,
          fileName: this.editDocFile!.name,
          base64: (reader.result as string).split(',')[1]
        });
        this.cancelEdit();
      };
    } else {
      this.updateDoc.emit({
        id: doc.id,
        descripcion: this.editDocDesc
      });
      this.cancelEdit();
    }
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
