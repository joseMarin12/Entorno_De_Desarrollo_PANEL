import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../../models/usuarios.model';

@Component({
  selector: 'app-usuarios-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})
export class UsuariosModalAddComponent {
  @Output() save = new EventEmitter<Omit<Usuario, 'id'>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', apellido1: '', apellido2: '', email: '', enabled: true };
  errors: Record<string, string> = {};

  toggleEnabled(): void {
    this.form.enabled = !this.form.enabled;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre) this.errors['nombre'] = 'Campo obligatorio';
    if (!this.form.apellido1) this.errors['apellido1'] = 'Campo obligatorio';
    if (!this.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      this.errors['email'] = 'Introduce un email válido';

    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ ...this.form });
    this.reset();
  }

  reset(): void {
    this.form = { nombre: '', apellido1: '', apellido2: '', email: '', enabled: true };
    this.errors = {};
  }
}
