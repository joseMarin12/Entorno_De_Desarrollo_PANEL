import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../models/empresa.model';

@Component({
  selector: 'app-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})
export class ModalAddComponent {
  @Output() save  = new EventEmitter<Omit<Empresa, 'id'>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', razonSocial: '', tipo: '', cif: '', direcciones: 0, contactos: 0, activo: true };
  errors: Record<string, string> = {};

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.razonSocial) this.errors['razonSocial'] = 'Campo obligatorio';
    if (!this.form.tipo) this.errors['tipo'] = 'Campo obligatorio';
    if (!this.form.cif) this.errors['cif'] = 'Campo obligatorio';
    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ ...this.form });
    this.reset();
  }

  reset(): void {
    this.form = { nombre: '', razonSocial: '', tipo: '', cif: '', direcciones: 0, contactos: 0, activo: true };
    this.errors = {};
  }
}