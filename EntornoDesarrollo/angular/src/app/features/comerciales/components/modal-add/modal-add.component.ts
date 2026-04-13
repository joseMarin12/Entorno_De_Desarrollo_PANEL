import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comercial } from '../../../../models/comercial.model';

@Component({
  selector: 'app-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})
export class ModalAddComponent {
  @Output() save  = new EventEmitter<Omit<Comercial, 'id'>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', email: '', activo: true };
  errors: Record<string, string> = {};

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.primer_apellido) this.errors['primer_apellido'] = 'Campo obligatorio';
    if (!this.form.telefono)  this.errors['telefono']  = 'Campo obligatorio';
    if (!this.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      this.errors['email'] = 'Introduce un email válido';

    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ ...this.form });
    this.reset();
  }

  reset(): void {
    this.form = { nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', email: '', activo: true };
    this.errors = {};
  }
}
