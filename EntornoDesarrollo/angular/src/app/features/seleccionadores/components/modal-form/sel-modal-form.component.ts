import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Seleccionador, TipoSeleccionador, EmpresaVinculada } from '../../../../models/seleccionador.model';
import { SeleccionadoresService } from '../../../../services/seleccionadores.service';

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
  @Output() save  = new EventEmitter<Omit<Seleccionador, 'id'>>();
  @Output() close = new EventEmitter<void>();

  svc = inject(SeleccionadoresService);

  form: Omit<Seleccionador, 'id'> = this.getDefaultForm();
  errors: Record<string, string> = {};

  get isEdit(): boolean { return this.seleccionador !== null; }
  get title(): string { return this.isEdit ? 'Editar Seleccionador' : 'Añadir Seleccionador'; }
  get subtitle(): string {
    return this.isEdit ? 'Modifica los datos del seleccionador' : 'Rellena los datos del nuevo seleccionador';
  }

  ngOnChanges(): void {
    if (this.seleccionador) {
      this.form = { ...this.seleccionador };
    } else {
      this.form = this.getDefaultForm();
    }
    this.errors = {};
  }

  private getDefaultForm(): Omit<Seleccionador, 'id'> {
    return {
      nombre: '',
      ap1: '',
      ap2: '',
      telefono: '',
      email: '',
      tipo: 'interno',
      activo: true,
      empresaVinculada: undefined,
      fechaInicio: '',
      salario: undefined,
      fee: undefined
    };
  }

  setTipo(tipo: TipoSeleccionador): void {
    this.form.tipo = tipo;
    if (tipo === 'interno') {
      this.form.empresaVinculada = undefined;
      this.form.fechaInicio = '';
      this.form.salario = undefined;
      this.form.fee = undefined;
    }
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre.trim()) this.errors['nombre'] = 'Campo obligatorio';
    if (!this.form.ap1.trim()) this.errors['ap1'] = 'Campo obligatorio';

    if (this.form.tipo === 'externo') {
      if (!this.form.email?.trim()) this.errors['email'] = 'Campo obligatorio';
      if (!this.form.empresaVinculada) {
        this.errors['empresa'] = 'Selecciona una empresa';
      }
    }

    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ ...this.form });
  }

  // Método simplificado para asignar la empresa única
  onEmpresaChange(id: string): void {
    const empresaId = parseInt(id);
    this.form.empresaVinculada = this.svc.empresasDisponibles.find(e => e.id === empresaId);
  }
}
