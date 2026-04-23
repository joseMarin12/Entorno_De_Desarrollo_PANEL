import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../../models/usuarios.model';

@Component({
  selector: 'app-usuarios-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-form.component.html',
})
export class UsuariosModalFormComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() emailUsuarios: string[] = [];
  @Output() save = new EventEmitter<Partial<Usuario>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', apellido1: '', email: '', password: '', roleid: 1 as number | string, enabled: true };
  errors: Record<string, string> = {};

  ngOnChanges(): void {
    if (this.usuario) {
      this.form = { 
        nombre: this.usuario.nombre,
        apellido1: this.usuario.apellido1,
        email: this.usuario.email,
        enabled: this.usuario.enabled,
        roleid: this.usuario.roleid || 1,
        password: '' // Se deja vacío por defecto en edición
      };
    } else {
      this.form = { nombre: '', apellido1: '', email: '', password: '', roleid: 1, enabled: true };
    }
    this.errors = {};
  }

  get isEdit(): boolean {
    return !!this.usuario;
  }

  get title(): string {
    return this.isEdit ? 'Editar Usuario' : 'Añadir Usuario';
  }

  get subtitle(): string {
    if (this.isEdit && this.usuario) {
      return `Modificando datos de ${[this.usuario.nombre, this.usuario.apellido1].join(' ')}`;
    }
    return 'Rellena los datos del nuevo usuario';
  }

  toggleEnabled(): void {
    this.form.enabled = !this.form.enabled;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre) this.errors['nombre'] = 'Campo obligatorio';
    if (!this.form.apellido1) this.errors['apellido1'] = 'Campo obligatorio';
    if (!this.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      this.errors['email'] = 'Introduce un email válido';
    } else {
      const emailLower = this.form.email.trim().toLowerCase();
      const currentEmailLower = this.usuario?.email?.toLowerCase();
      
      // Si es nuevo o el email ha cambiado y ya existe en la lista de registrados
      if ((!this.isEdit || emailLower !== currentEmailLower) && this.emailUsuarios.includes(emailLower)) {
        this.errors['email'] = 'Este correo ya pertenece a un usuario o comercial registrado';
      }
    }
    
    if (!this.isEdit && !this.form.password) {
        this.errors['password'] = 'Campo obligatorio';
    }

    if (!this.form.roleid) this.errors['roleid'] = 'Campo obligatorio';

    if (Object.keys(this.errors).length > 0) return;

    if (this.isEdit) {
       this.save.emit({ id: this.usuario!.id, ...this.form });
    } else {
       this.save.emit({ ...this.form });
    }
  }
}
