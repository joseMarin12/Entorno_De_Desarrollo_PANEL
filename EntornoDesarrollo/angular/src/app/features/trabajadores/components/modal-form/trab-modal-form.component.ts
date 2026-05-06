import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trabajador } from '../../../../models/trabajador.model';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-trab-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  `]
})
export class TrabModalFormComponent implements OnChanges {
  private toast = inject(ToastService);

  @Input() trabajador: Trabajador | null = null;
  @Input() existingEmails: string[] = [];
  @Input() existingDnis: string[] = [];

  // Lookups
  @Input() seleccionadores: {id: number, nombre: string}[] = [];
  @Input() provincias: {id: number, nombre: string}[] = [];
  @Input() localidadesTodas: {id: number, id_provincia: number, nombre: string}[] = [];

  @Output() save = new EventEmitter<Omit<Trabajador, 'id'>>();
  @Output() close = new EventEmitter<void>();

  // Form state (ngModel-driven, same pattern as Seleccionadores)
  form: Omit<Trabajador, 'id'> = this.getDefaultForm();
  errors: Record<string, string> = {};
  activeTab = signal<'personales' | 'laborales'>('personales');
  localidadesFiltradas: {id: number, nombre: string}[] = [];

  get isEdit(): boolean { return this.trabajador !== null; }
  get title(): string { return this.isEdit ? 'Editar Trabajador' : 'Nuevo Trabajador'; }
  get subtitle(): string {
    return this.isEdit
      ? 'Modifica los datos del trabajador'
      : 'Rellena los datos del nuevo trabajador';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('trabajador' in changes) {
      if (this.trabajador) {
        this.form = { ...this.trabajador };
        // Cascade: cargar localidades de la provincia guardada
        if (this.trabajador.id_provincia) {
          this.localidadesFiltradas = this.localidadesTodas.filter(
            l => l.id_provincia == this.trabajador!.id_provincia
          );
        }
      } else {
        this.form = this.getDefaultForm();
        this.localidadesFiltradas = [];
      }
      this.errors = {};
      this.activeTab.set('personales');
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

  setTab(tab: 'personales' | 'laborales'): void {
    this.activeTab.set(tab);
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  toggleFreelance(val: boolean): void {
    this.form.freelance = val;
  }

  // CASCADE SELECT
  onProvinciaChange(provinciaId: string): void {
    const id = provinciaId ? Number(provinciaId) : undefined;
    this.form.id_provincia = id;
    this.form.id_localidad = undefined;
    if (id) {
      this.localidadesFiltradas = this.localidadesTodas.filter(l => l.id_provincia == id);
    } else {
      this.localidadesFiltradas = [];
    }
  }

  onLocalidadChange(localidadId: string): void {
    this.form.id_localidad = localidadId ? Number(localidadId) : undefined;
  }

  onSeleccionadorChange(selId: string): void {
    this.form.id_seleccionadores = selId ? Number(selId) : undefined;
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
    if (this.form.email?.trim()) {
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

    if (this.form.telefono?.trim()) {
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

    // Limpieza de undefined a null para el backend
    const payload = Object.fromEntries(
      Object.entries(this.form).map(([key, val]) => [key, val === undefined ? null : val])
    ) as Omit<Trabajador, 'id'>;

    this.save.emit(payload);
  }
}
