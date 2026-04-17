import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() emailUsuarios: string[] = [];
  @Output() save = new EventEmitter<Omit<Usuario, 'id'>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', apellido1: '', email: '', password: '', role_id: 1, enabled: true };
  errors: Record<string, string> = {};

  toggleEnabled(): void {
    this.form.enabled = !this.form.enabled;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre) this.errors['nombre'] = 'Campo obligatorio';
    if (!this.form.apellido1) this.errors['apellido1'] = 'Campo obligatorio';
    if (!this.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      this.errors['email'] = 'Introduce un email válido';
    } else if (this.emailUsuarios.includes(this.form.email.trim().toLowerCase())) {
      this.errors['email'] = 'Este correo ya pertenece a un usuario o comercial registrado';
    }
    
    if (!this.form.password) this.errors['password'] = 'Campo obligatorio';
    if (!this.form.role_id) this.errors['role_id'] = 'Campo obligatorio';

    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ ...this.form });
    this.reset();
  }

  reset(): void {
    this.form = { nombre: '', apellido1: '', email: '', password: '', role_id: 1, enabled: true };
    this.errors = {};
  }
}
