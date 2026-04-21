import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Seleccionador, TipoSeleccionador } from '../../../../models/seleccionador.model';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-sel-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sel-modal-form.component.html',
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
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #d1d5db;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .type-card.active .type-radio {
      border-color: #00838f;
      background: #00838f;
    }
    .type-radio-inner {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
    }
    .type-info .type-title { font-size: 13px; font-weight: 700; color: var(--text); }
    .type-info .type-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; line-height: 1.3; }

    .external-section {
      background: #f8f9fd;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-top: 10px;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      display: block;
    }
  `]
})
export class SelModalFormComponent implements OnChanges {
  @Input() seleccionador: Seleccionador | null = null;
  @Input() empresasDisponibles: {id: number, nombre: string}[] = [];
  @Input() existingEmails: string[] = [];
  @Output() save  = new EventEmitter<Omit<Seleccionador, 'id'>>();
  @Output() close = new EventEmitter<void>();

  private toast = inject(ToastService);

  form: Omit<Seleccionador, 'id'> = this.getDefaultForm();
  errors: Record<string, string> = {};

  get isEdit(): boolean { return this.seleccionador !== null; }
  get title(): string { return this.isEdit ? 'Editar Seleccionador' : 'Añadir Seleccionador'; }
  get subtitle(): string {
    return this.isEdit ? 'Modifica los datos del seleccionador' : 'Rellena los datos del nuevo seleccionador';
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Solo reiniciar el form cuando cambia el seleccionador (crear vs. editar)
    // Ignorar cambios de 'empresasDisponibles' y 'existingEmails' para no
    // interrumpir la interacción del usuario con el formulario
    if ('seleccionador' in changes) {
      if (this.seleccionador) {
        this.form = { ...this.seleccionador };
      } else {
        this.form = this.getDefaultForm();
      }
      this.errors = {};
    }
  }

  private getDefaultForm(): Omit<Seleccionador, 'id'> {
    return {
      nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      telefono: '',
      email: '',
      tipo: 'interno',
      activo: true,
      id_empresa: undefined,
      empresa: undefined,
      fecha_ini: '',
      salario: undefined,
      fee: undefined
    };
  }

  setTipo(tipo: TipoSeleccionador): void {
    this.form.tipo = tipo;
    if (tipo === 'interno') {
      this.form.telefono = '';
      this.form.email = '';
      this.form.id_empresa = undefined;
      this.form.empresa = undefined;
      this.form.fecha_ini = '';
      this.form.salario = undefined;
      this.form.fee = undefined;
    }
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    
    // Validaciones comunes
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

    // Validaciones específicas para externos
    if (this.form.tipo === 'externo') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email?.trim()) {
        this.errors['email'] = 'Campo obligatorio';
      } else if (!emailRegex.test(this.form.email.trim())) {
        this.errors['email'] = 'Formato de correo inválido';
      } else if (this.existingEmails.includes(this.form.email.trim().toLowerCase())) {
        this.errors['email'] = 'Este correo ya está registrado';
      }

      if (this.form.telefono?.trim()) {
        const phoneRegex = /^[0-9\+\s\-]{6,15}$/;
        if (!phoneRegex.test(this.form.telefono.trim())) {
          this.errors['telefono'] = 'Formato de teléfono inválido';
        }
      }

      if (!this.form.id_empresa) {
        this.errors['empresa'] = 'Selecciona una empresa';
      }
      
      if (this.form.salario !== undefined && this.form.salario !== null) {
        if (this.form.salario <= 0) {
          this.errors['salario'] = 'El salario debe ser mayor a 0';
        }
      }

      if (this.form.fee !== undefined && this.form.fee !== null) {
        if (this.form.fee < 0 || this.form.fee > 100) {
          this.errors['fee'] = 'El fee debe estar entre 0 y 100';
        }
      }
    }

    if (Object.keys(this.errors).length > 0) {
      this.toast.show('warning', 'Hay campos con errores. Por favor, revisa las alertas en rojo.');
      return;
    }

    this.save.emit({ ...this.form });
  }

  // Método para asignar el ID de empresa para el backend
  onEmpresaChange(id: string): void {
    const empresaId = parseInt(id);
    this.form.id_empresa = empresaId;
    this.form.empresa = this.empresasDisponibles.find(e => e.id === empresaId);
  }
}
