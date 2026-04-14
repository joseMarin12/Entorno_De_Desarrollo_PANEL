import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Formacion } from '../../../../models/formacion.model';

@Component({
  selector: 'app-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',
})
export class ModalEditComponent implements OnInit {
  @Input({ required: true }) formacion!: Formacion;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Formacion>();

  form!: Formacion;
  errors: Record<string, string> = {};

  ngOnInit(): void {
    this.form = { ...this.formacion };
  }

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
