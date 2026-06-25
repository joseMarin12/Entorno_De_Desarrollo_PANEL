import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trabajador, getColorFor, getInitials } from '../../../../models/trabajador.model';
import { EstadoFirma, FirmaModalData, MOTIVO_CANCELACION_RRHH, PosicionFirma, estadoFirmaLabel, estadoFirmaCssClass } from '../../../../models/firma.model';
import { DocPreviewModalComponent } from '../../../../shared/doc-preview-modal/doc-preview-modal.component';
import { FirmaPlacementComponent } from '../firma-placement/firma-placement.component';

@Component({
  selector: 'app-trab-modal-firma',
  standalone: true,
  imports: [CommonModule, FormsModule, DocPreviewModalComponent, FirmaPlacementComponent],
  templateUrl: './trab-modal-firma.component.html',
  styles: [`
    .modal-firma { max-width: 680px; }

    .header-hero {
      padding: 26px 30px 22px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px;
    }
    .worker-chip { display: flex; align-items: center; gap: 14px; }
    .avatar-mini {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 15px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    .worker-name { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.2px; line-height: 1.25; }
    .worker-sub { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

    .estado-banner {
      padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
      display: inline-flex; align-items: center; gap: 6px;
      letter-spacing: 0.3px;
    }
    .estado-banner .dot { width: 6px; height: 6px; border-radius: 50%; }
    .estado-banner.pendiente { background: #f1f5f9; color: #475569; }
    .estado-banner.pendiente .dot { background: #94a3b8; }
    .estado-banner.proceso { background: #fef3c7; color: #92400e; }
    .estado-banner.proceso .dot { background: #f59e0b; }
    .estado-banner.completado { background: #d1fae5; color: #065f46; }
    .estado-banner.completado .dot { background: #10b981; }
    .estado-banner.rechazado { background: #fee2e2; color: #991b1b; }
    .estado-banner.rechazado .dot { background: #ef4444; }
    .estado-banner.cancelado { background: #f1f5f9; color: #475569; }
    .estado-banner.cancelado .dot { background: #94a3b8; }

    .body-modal {
      padding: 22px 30px 26px;
      max-height: 64vh; overflow-y: auto;
      display: flex; flex-direction: column; gap: 22px;
    }
    .section-title {
      font-size: 11px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    /* Ficha info doc (solo lectura) */
    .doc-summary {
      background: #fafbff; border: 1px solid var(--border);
      border-radius: 10px; padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
    }
    .doc-summary-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #ede9fe; color: var(--purple-dark);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .doc-summary-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .doc-summary-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* Radio cards para selección de firmantes */
    .firmantes-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .firmante-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      cursor: pointer;
      display: flex; align-items: flex-start; gap: 10px;
      transition: all 0.2s;
      background: #fff;
    }
    .firmante-card:hover { border-color: #c4b5fd; background: #fafbff; }
    .firmante-card.active {
      border-color: var(--purple-dark);
      background: #f5f3ff;
    }
    .firmante-radio {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid #d1d5db;
      display: flex; align-items: center; justify-content: center;
      margin-top: 2px; flex-shrink: 0;
    }
    .firmante-card.active .firmante-radio {
      border-color: var(--purple-dark);
      background: var(--purple-dark);
    }
    .firmante-radio-inner {
      width: 6px; height: 6px; border-radius: 50%; background: #fff;
    }
    .firmante-info .firmante-title { font-size: 13px; font-weight: 700; color: var(--text); }
    .firmante-info .firmante-desc { font-size: 11px; color: var(--text-muted); margin-top: 3px; line-height: 1.35; }

    .field-label { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
    .form-textarea {
      width: 100%; border: 1px solid var(--border); border-radius: 8px;
      padding: 11px 13px; font-size: 13px; line-height: 1.5;
      font-family: inherit; resize: vertical; min-height: 100px;
      color: var(--text); background: #fff;
    }
    .form-textarea:focus { outline: none; border-color: var(--purple-dark); }

    /* Timeline */
    .timeline {
      background: #fafbff; border: 1px solid var(--border);
      border-radius: 10px; padding: 16px 22px;
    }
    .timeline-step {
      display: flex; gap: 14px; padding: 10px 0;
      position: relative;
    }
    .timeline-step:not(:last-child)::after {
      content: ''; position: absolute;
      left: 11px; top: 32px; bottom: -10px;
      width: 2px; background: #e5e7eb;
    }
    .timeline-step.done:not(:last-child)::after { background: #10b981; }
    .timeline-step.fail:not(:last-child)::after { background: #ef4444; }
    .timeline-marker {
      width: 24px; height: 24px; border-radius: 50%;
      background: #e5e7eb; color: #9ca3af;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; z-index: 1;
      font-size: 11px; font-weight: 700;
    }
    .timeline-step.done .timeline-marker { background: #10b981; color: #fff; }
    .timeline-step.current .timeline-marker {
      background: #f59e0b; color: #fff;
      box-shadow: 0 0 0 4px #fef3c7;
    }
    .timeline-step.fail .timeline-marker { background: #ef4444; color: #fff; }
    /* Punto de cancelación por RRHH: marcador gris neutro (no es un fallo del firmante). */
    .timeline-step.cancel .timeline-marker { background: #9ca3af; color: #fff; }
    .timeline-content .step-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .timeline-content .step-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    .footer-modal {
      padding: 16px 30px; background: #fafbff;
      border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn-danger-outline {
      background: #fff; color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .btn-danger-outline:hover { background: #fef2f2; }

    /* Indicador "Actualización en tiempo real" */

    .auto-update-badge {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 4px 11px; border-radius: 14px;
      background: #fef3c7; color: #92400e;
      font-size: 11px; font-weight: 600; letter-spacing: 0.2px;
    }
    .auto-update-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #f59e0b;
      animation: auto-update-pulse 1.6s infinite;
    }
    @keyframes auto-update-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.55); }
      70%  { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }

    /* ── Botón "Ver documento" en la ficha resumen ── */
    .doc-summary-preview-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 12px; flex-shrink: 0;
      font-size: 12px; font-weight: 600;
      background: #fff; color: var(--purple-dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer; white-space: nowrap;
      transition: background 0.15s, border-color 0.15s;
    }
    .doc-summary-preview-btn:hover {
      background: #f5f3ff;
      border-color: #c4b5fd;
    }

    /* ── Spinner del botón mientras se envía a firma ── */
    .btn-spinner {
      display: inline-block;
      width: 14px; height: 14px;
      margin-right: 6px;
      border: 2px solid rgba(255, 255, 255, 0.45);
      border-top-color: #fff;
      border-radius: 50%;
      animation: btn-spin 0.6s linear infinite;
      vertical-align: -2px;
    }
    @keyframes btn-spin { to { transform: rotate(360deg); } }
  `]
})
export class TrabModalFirmaComponent implements OnInit, OnChanges {
  @Input({ required: true }) trabajador!: Trabajador;
  @Input() firma: FirmaModalData | null = null;
  @Input() previewBase64: string | null = null;
  @Input() enviando = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<any>();
  @Output() eliminarDoc = new EventEmitter<{ doc_id?: number; nombre_fichero?: string | null }>();

  @Output() requestPreviewArchivo = new EventEmitter<FirmaModalData>();

  showPreview = signal(false);

  abrirPreview(): void {
    if (this.firma) this.requestPreviewArchivo.emit(this.firma);
    this.showPreview.set(true);
  }

  mostrarPlacement = signal(false);
  posiciones = signal<PosicionFirma[]>([]);
  abrirPlacement(): void {
    if (this.firma) this.requestPreviewArchivo.emit(this.firma);
    this.mostrarPlacement.set(true);
  }
  onGuardarPosiciones(posiciones: PosicionFirma[]): void {
    this.posiciones.set(posiciones);
    this.mostrarPlacement.set(false);
  }
  onCancelarPlacement(): void {
    this.mostrarPlacement.set(false);
  }

  get previewMeta(): string {
    const tipo = this.firma?.tipo_nombre || '';
    const fecha = this.firma?.fecha_asignacion;
    return [tipo, fecha].filter(Boolean).join(' · ');
  }

  estado = signal<EstadoFirma>('PENDIENTE_ENVIO');

  vistaInterna = signal<'progreso' | 'formulario'>('formulario');

  // Selección de firmantes y sus correos
  modoFirmantes: 'solo' | 'doble' = 'solo';
  emailTrabajador = '';
  emailSegundoFirmante = '';

  // Plantilla de correo
  mensajeCorreo = '';

  colorFor = getColorFor;
  initials = getInitials;

  readonly motivoCancelacion = MOTIVO_CANCELACION_RRHH;

  ngOnInit(): void {
    this.emailTrabajador = this.trabajador?.email ?? '';
    this.syncFromFirma();
    this.mensajeCorreo = this.plantillaCorreoPredeterminada();
    this.vistaInterna.set(this.esPendiente ? 'formulario' : 'progreso');
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['firma'] && !changes['firma'].firstChange) {
      const prev = changes['firma'].previousValue;
      const curr = changes['firma'].currentValue;
      const mismaFirma = !!prev && !!curr && prev.doc_id === curr.doc_id;
      this.syncFromFirma(!mismaFirma);
      if (this.esEnFirma || this.esCompletado) this.vistaInterna.set('progreso');
    }
  }

  private syncFromFirma(incluirFormulario: boolean = true): void {
    if (!this.firma) return;
    this.estado.set(this.firma.estado);
    if (!incluirFormulario) return;
    this.posiciones.set([]);
    if (this.firma.requiere_firma_rrhh !== undefined) {
      this.modoFirmantes = this.firma.requiere_firma_rrhh ? 'doble' : 'solo';
    }
    if (this.firma.email_segundo_firmante !== undefined) {
      this.emailSegundoFirmante = this.firma.email_segundo_firmante ?? '';
    }
  }

  irAFormulario(): void { this.vistaInterna.set('formulario'); }

  volverAProgreso(): void { this.vistaInterna.set('progreso'); }

  get vistaEsProgreso() { return this.vistaInterna() === 'progreso'; }
  get vistaEsFormulario() { return this.vistaInterna() === 'formulario'; }

  get esPendiente() { return this.estado() === 'PENDIENTE_ENVIO'; }
  get esEnFirma() { return this.estado() === 'EN_SINATURA'; }
  get esCompletado() { return this.estado() === 'COMPLETADO'; }
  get esRechazado() { return this.estado() === 'RECHAZADO'; }

  get esCancelado() { return this.estado() === 'CANCELADO'; }

  get esTerminalNoExitoso() { return this.esRechazado || this.esCancelado; }

  get puedeUbicarFirmas(): boolean {
    return this.vistaEsFormulario && (this.esPendiente || this.esTerminalNoExitoso);
  }

  get estadoLabel(): string { return estadoFirmaLabel(this.estado()); }
  get estadoCssClass(): string { return estadoFirmaCssClass(this.estado()); }

  get tituloModal(): string {
    if (this.esPendiente) return 'Enviar a firma';
    if (this.esEnFirma) return 'Progreso de la firma';
    if (this.esCompletado) return 'Documento firmado';
    if (this.vistaEsFormulario) return 'Reenviar a firma';
    return this.esCancelado ? 'Firma cancelada' : 'Firma rechazada';
  }

  get accionPrincipalLabel(): string {
    if (this.esPendiente) return 'Enviar a firma';
    if (this.esCompletado) return 'Descargar firmado';
    return 'Reenviar a firma';
  }

  get mostrarAccionPrincipal(): boolean {
    return !this.esEnFirma;
  }

  // ── Plantilla de correo
  private plantillaCorreoPredeterminada(): string {
    const nombre = this.trabajador
      ? `${this.trabajador.nombre} ${this.trabajador.primer_apellido}`.trim()
      : 'trabajador/a';
    const tipo = this.firma?.tipo_nombre || 'documento';
    return [
      `Buen día,`,
      ``,
      `Te enviamos el documento ${tipo} correspondiente a ${nombre} para que proceda a su firma electrónica.`,
      ``,
      `Por favor, haz clic en el enlace que recibirás de Sinatura para completar el proceso.`,
      ``,
      `Cualquier duda, no dudes en contactarnos.`,
      ``,
      `Un saludo,`,
      `Departamento de Recursos Humanos`
    ].join('\n');
  }

  // ── Acciones ─────────────────────────────────────────────────────────────
  onAccionPrincipal(): void {
    this.save.emit({
      estado: this.estado(),
      firma_id: this.firma?.id,
      doc_id: this.firma?.doc_id,
      modo_firmantes: this.modoFirmantes,
      email_trabajador: this.emailTrabajador.trim(),
      email_segundo_firmante: this.modoFirmantes === 'doble' ? this.emailSegundoFirmante.trim() : null,
      mensaje_correo: this.mensajeCorreo,
      posiciones: this.posiciones()
    });
  }

  onCancelarFirma(): void {
    this.cancelar.emit({
      firma_id: this.firma?.id,
      doc_id: this.firma?.doc_id
    });
  }

  onEliminarDoc(): void {
    this.eliminarDoc.emit({
      doc_id: this.firma?.doc_id,
      nombre_fichero: this.firma?.nombre_fichero
    });
  }

  // Para timeline
  pasoCompletado(paso: 'creado' | 'enviado' | 'firmado' | 'rrhh' | 'completado'): boolean {
    const e = this.estado();
    if (paso === 'creado') return true;
    if (this.esCancelado) {
      if (paso === 'enviado') return true;
      if (paso === 'firmado') return !!this.firma?.fecha_firma_trabajador;
      if (paso === 'rrhh') return !!this.firma?.fecha_firma_rrhh;
      return false;
    }
    if (paso === 'enviado') return e === 'EN_SINATURA' || e === 'COMPLETADO' || e === 'RECHAZADO';
    if (paso === 'firmado') return e === 'COMPLETADO';
    if (paso === 'rrhh') return e === 'COMPLETADO' && this.modoFirmantes === 'doble';
    if (paso === 'completado') return e === 'COMPLETADO';
    return false;
  }

  pasoActual(paso: 'creado' | 'enviado' | 'firmado' | 'rrhh' | 'completado'): boolean {
    return paso === 'enviado' && this.esEnFirma;
  }

  pasoFallido(paso: 'creado' | 'enviado' | 'firmado' | 'rrhh' | 'completado'): boolean {
    if (!this.esRechazado) return false;
    if (this.modoFirmantes === 'doble' && this.firma?.fecha_firma_trabajador) {
      return paso === 'rrhh';
    }
    return paso === 'firmado';
  }

  pasoCancelado(paso: 'creado' | 'enviado' | 'firmado' | 'rrhh' | 'completado'): boolean {
    if (!this.esCancelado) return false;
    if (this.modoFirmantes === 'doble' && this.firma?.fecha_firma_trabajador) {
      return paso === 'rrhh';
    }
    return paso === 'firmado';
  }

  pasoNoAlcanzado(paso: 'creado' | 'enviado' | 'firmado' | 'rrhh' | 'completado'): boolean {
    return !this.pasoCompletado(paso) && !this.pasoActual(paso)
        && !this.pasoFallido(paso) && !this.pasoCancelado(paso);
  }

  formatFecha(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  get accionPrincipalDeshabilitada(): boolean {
    if (!this.esPendiente && !this.esTerminalNoExitoso) return false;
    if (!this.emailTrabajador.trim()) return true;
    if (this.modoFirmantes === 'doble' && !this.emailSegundoFirmante.trim()) return true;
    return false;
  }
}
