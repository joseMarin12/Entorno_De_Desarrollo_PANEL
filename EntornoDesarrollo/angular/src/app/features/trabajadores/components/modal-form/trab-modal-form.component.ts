import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trabajador, TrabajadorFormData } from '../../../../models/trabajador.model';
import { ToastService } from '../../../../services/toast.service';
import { DocUploadFormComponent, NuevoDocumento } from '../doc-upload-form/doc-upload-form.component';
import { TrabajadoresApiService } from '../../../../services/trabajadores-api.service';
import { LookupSelectComponent } from '../../../../shared/lookup-select/lookup-select.component';

@Component({
  selector: 'app-trab-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DocUploadFormComponent, LookupSelectComponent],
  templateUrl: './trab-modal-form.component.html',
  styles: [`
    .type-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .type-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      transition: all 0.2s;
    }
    .type-card:hover { border-color: var(--blue-mid); background: #fafbff; }
    .type-card.active {
      border-color: #23b4cd;
      background: #e0f7fa;
    }
    .type-radio {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid #d1d5db;
      display: flex; align-items: center; justify-content: center;
      margin-top: 2px; flex-shrink: 0;
    }
    .type-card.active .type-radio {
      border-color: #00838f;
      background: #00838f;
    }
    .type-radio-inner {
      width: 6px; height: 6px; border-radius: 50%; background: #fff;
    }
    .type-info .type-title { font-size: 13px; font-weight: 700; color: var(--text); }
    .type-info .type-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; line-height: 1.3; }

    .section-title {
      font-size: 12px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 16px; display: block;
    }

    .tabs-nav {
      display: flex; border-bottom: 1px solid var(--border);
      margin-bottom: 24px; gap: 0;
    }
    .tab-item {
      padding: 10px 20px; color: var(--text-muted); font-weight: 600;
      font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .tab-item:hover { color: var(--text); }
    .tab-item.active {
      color: var(--purple-dark);
      border-bottom-color: var(--purple-dark);
    }
    .tab-error-dot {
      display: inline-block; width: 6px; height: 6px;
      border-radius: 50%; background: var(--danger);
      margin-right: 6px; vertical-align: middle;
    }

    /* Tarjeta de doc pendiente bloqueado (requiere firma) */
    .pending-doc-card { transition: background 0.2s, border-color 0.2s; }
    .pending-doc-card.blocked {
      opacity: 0.78;
      background: #f9fafb !important;
      border-style: dashed !important;
    }
    .pending-doc-icon-blocked {
      width: 44px; height: 44px;
      background: #e5e7eb; color: #9ca3af;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    /* Badge de estado en pendientes */
    .pending-estado-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.3px;
      background: #f1f5f9; color: #475569;
    }
    .pending-estado-badge .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #94a3b8;
    }

  `]
})
export class TrabModalFormComponent implements OnChanges {
  private toast = inject(ToastService);
  protected api = inject(TrabajadoresApiService);

  @Input() trabajador: Trabajador | null = null;
  @Input() existingEmails: string[] = [];
  @Input() existingDnis: string[] = [];

  // Lookups
  @Input() tiposDoc: {id: number, tipo: string}[] = [];

  @Output() save = new EventEmitter<TrabajadorFormData>();
  @Output() close = new EventEmitter<void>();

  // Form state (ngModel-driven, same pattern as Seleccionadores)
  form: Omit<Trabajador, 'id'> = this.getDefaultForm();
  errors: Record<string, string> = {};
  activeTab = signal<'personales' | 'laborales' | 'documentos'>('personales');

  // Documentos pendientes (se procesan al guardar el trabajador).
  pendingDocs = signal<{
    origen: 'subir';
    tipoId?: string;
    descripcion: string;
    file?: File;
    base64?: string;
    requiere_firma: boolean;
  }[]>([]);

  get isEdit(): boolean { return this.trabajador !== null; }
  get title(): string { return this.isEdit ? 'Editar Trabajador' : 'Nuevo Trabajador'; }
  get subtitle(): string {
    return this.isEdit
      ? 'Modifica los datos del trabajador'
      : 'Rellena los datos del nuevo trabajador';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('trabajador' in changes) {
      this.form = this.trabajador ? { ...this.trabajador } : this.getDefaultForm();
      this.errors = {};
      this.activeTab.set('personales');
      this.pendingDocs.set([]);
    }
  }

  private getDefaultForm(): Omit<Trabajador, 'id'> {
    return {
      nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      dni_nif_pasaporte: '',
      nacionalidad: '',
      fecha_nacimiento: '',
      telefono: '',
      email: '',
      direccion: '',
      codigo_postal: '',
      activo: true,
      freelance: false,
      salario: undefined,
      cheques_restaurante: undefined,
      cheques_guarderia: undefined,
      fecha_ini: '',
      fecha_fin: '',
      id_seleccionadores: undefined,
      id_provincia: undefined,
      id_localidad: undefined,
    };
  }

  setTab(tab: 'personales' | 'laborales' | 'documentos'): void {
    this.activeTab.set(tab);
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  toggleFreelance(val: boolean): void {
    this.form.freelance = val;
  }

  /** Al cambiar la provincia se limpia la localidad; el cascade lo aplica el lookup-select. */
  onProvinciaChange(): void {
    this.form.id_localidad = undefined;
  }

  // ── Documentos 
  onDocAdded(doc: NuevoDocumento): void {
    this.pendingDocs.set([...this.pendingDocs(), {
      origen: 'subir',
      tipoId: doc.tipoId,
      descripcion: doc.descripcion,
      file: doc.file,
      base64: doc.base64,
      requiere_firma: doc.requiereFirma,
    }]);
  }

  removePendingDoc(index: number): void {
    const current = [...this.pendingDocs()];
    current.splice(index, 1);
    this.pendingDocs.set(current);
  }

  // TABS CON ERRORES
  get hasPersonalesErrors(): boolean {
    return !!(this.errors['nombre'] || this.errors['primer_apellido'] || this.errors['dni_nif_pasaporte'] || this.errors['email'] || this.errors['telefono']);
  }
  get hasLaboralesErrors(): boolean {
    return !!(this.errors['salario']);
  }

  submit(): void {
    this.errors = {};

    // ── Validaciones Personales ──
    if (!this.form.nombre?.trim()) {
      this.errors['nombre'] = 'Campo obligatorio';
    } else if (this.form.nombre.trim().length < 2) {
      this.errors['nombre'] = 'El nombre es muy corto';
    }

    if (!this.form.primer_apellido?.trim()) {
      this.errors['primer_apellido'] = 'Campo obligatorio';
    } else if (this.form.primer_apellido.trim().length < 2) {
      this.errors['primer_apellido'] = 'El apellido es muy corto';
    }

    if (!this.form.dni_nif_pasaporte?.trim()) {
      this.errors['dni_nif_pasaporte'] = 'Campo obligatorio';
    } else {
      const currentDni = this.form.dni_nif_pasaporte.trim();
      if (this.existingDnis.includes(currentDni) && (!this.isEdit || currentDni !== this.trabajador?.dni_nif_pasaporte)) {
        this.errors['dni_nif_pasaporte'] = 'Este DNI/NIF ya está registrado';
      }
    }

    // ── Validaciones Contacto ──
    if (!this.form.email?.trim()) {
      this.errors['email'] = 'Campo obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email.trim())) {
        this.errors['email'] = 'Formato de correo inválido';
      } else {
        const currentEmail = this.form.email.trim().toLowerCase();
        if (this.existingEmails.includes(currentEmail) && (!this.isEdit || currentEmail !== this.trabajador?.email?.toLowerCase())) {
          this.errors['email'] = 'Este correo ya está registrado';
        }
      }
    }

    if (!this.form.telefono?.trim()) {
      this.errors['telefono'] = 'Campo obligatorio';
    } else {
      const phoneRegex = /^[0-9\+\s\-]{6,15}$/;
      if (!phoneRegex.test(this.form.telefono.trim())) {
        this.errors['telefono'] = 'Formato de teléfono inválido';
      }
    }

    // ── Validaciones Laborales ──
    if (this.form.salario !== undefined && this.form.salario !== null) {
      if (Number(this.form.salario) < 0) {
        this.errors['salario'] = 'El salario no puede ser negativo';
      }
    }

    // Si hay errores, navegamos a la pestaña correspondiente
    if (Object.keys(this.errors).length > 0) {
      if (this.hasPersonalesErrors) {
        this.activeTab.set('personales');
      } else if (this.hasLaboralesErrors) {
        this.activeTab.set('laborales');
      }
      this.toast.show('warning', 'Hay campos con errores. Revisa las alertas en rojo.');
      return;
    }

    // El servicio normaliza undefined→null en el borde con el backend; aquí emitimos el form tal cual.
    this.save.emit({
      ...this.form,
      documentos: this.pendingDocs().map(doc => ({
        origen: doc.origen,
        tipoId: doc.tipoId,
        descripcion: doc.descripcion,
        base64: doc.base64 ? doc.base64.split(',')[1] : null,
        nombre: doc.file?.name || 'documento.bin',
        requiere_firma: doc.requiere_firma
      }))
    });
  }
}
