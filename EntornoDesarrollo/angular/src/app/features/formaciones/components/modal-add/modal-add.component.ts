import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Formacion } from '../../../../models/formacion.model';

@Component({
  selector: 'app-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})
export class ModalAddComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Omit<Formacion, 'id'>>();

  form: Omit<Formacion, 'id'> = {
    id_estado: 1,
    curso: '',
    denominacion: '',
    motivo: '',
    id_area: 0,
    recursos: '',
    id_responsable: 0,
    id_modalidad: 0,
    duracion: 0,
    dentro_fuera_jornada: '',
    observaciones: '',
    fecha_prevista: '',
    fecha_inicio: '',
    fecha_fin: '',
    horario: '',
    id_ejecucion: 0,
    eficacia: '',
    anio: new Date().getFullYear(),
    coste: 0,
    bonificacion: 0,
    total: 0,
    activo: true
  };

  errors: Record<string, string> = {};

  toggleActivo(): void {
    this.form.id_estado = (this.form.id_estado === 1) ? 2 : 1;
  }

  calculateTotal(): void {
    const coste = Number(this.form.coste) || 0;
    const bonificacion = Number(this.form.bonificacion) || 0;
    this.form.total = coste - bonificacion;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.curso?.trim()) this.errors['curso'] = 'El curso es obligatorio';
    if (!this.form.denominacion?.trim()) this.errors['denominacion'] = 'La denominación es obligatoria';

    if (Object.keys(this.errors).length > 0) return;
    this.save.emit(this.form);
  }
}
