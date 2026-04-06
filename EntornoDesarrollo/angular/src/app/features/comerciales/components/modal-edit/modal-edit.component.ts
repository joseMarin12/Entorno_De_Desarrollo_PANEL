import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comercial } from '../../../../models/comercial.model';

@Component({
  selector: 'app-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',
})
export class ModalEditComponent implements OnChanges {
  @Input() comercial: Comercial | null = null;
  @Output() save  = new EventEmitter<Comercial>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', apellido1: '', apellido2: '', telefono: '', email: '', activo: true };
  errors: Record<string, string> = {};

  ngOnChanges(): void {
    if (this.comercial) {
      this.form = { ...this.comercial };
      this.errors = {};
    }
  }

  get subtitle(): string {
    if (!this.comercial) return '';
    return `Modificando datos de ${[this.comercial.nombre, this.comercial.apellido1].join(' ')}`;
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.apellido1) this.errors['apellido1'] = 'Campo obligatorio';
    if (!this.form.telefono)  this.errors['telefono']  = 'Campo obligatorio';
    if (!this.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      this.errors['email'] = 'Introduce un email válido';

    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ id: this.comercial!.id, ...this.form });
  }
}
