import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../../models/usuarios.model';

@Component({
  selector: 'app-usuarios-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',
})
export class UsuariosModalEditComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Output() save = new EventEmitter<Usuario>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', apellido1: '', email: '', password: '', role_id: 1 as number | string, enabled: true };
  errors: Record<string, string> = {};

  ngOnChanges(): void {
    if (this.usuario) {
      this.form = { 
        nombre: this.usuario.nombre,
        apellido1: this.usuario.apellido1,
        email: this.usuario.email,
        enabled: this.usuario.enabled,
        role_id: this.usuario.role_id || 1,
        password: '' // Se deja vacío por defecto en edición
      };
      this.errors = {};
    }
  }

  get subtitle(): string {
    if (!this.usuario) return '';
    return `Modificando datos de ${[this.usuario.nombre, this.usuario.apellido1].join(' ')}`;
  }

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

    this.save.emit({ id: this.usuario!.id, ...this.form });
  }
}
