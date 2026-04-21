import { Component, EventEmitter, Input, OnChanges, SimpleChanges, Output } from '@angular/core';
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
  @Input() existingEmails: string[] = [];
  @Output() save  = new EventEmitter<Comercial>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', primer_apellido: '', segundo_apellido: '', telefono: '', email: '', activo: true };
  errors: Record<string, string> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comercial'] && this.comercial) {
      this.form = { ...this.comercial };
      this.errors = {};
    }
  }

  get subtitle(): string {
    if (!this.comercial) return '';
    return `Modificando datos de ${[this.comercial.nombre, this.comercial.primer_apellido].join(' ')}`;
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.primer_apellido) this.errors['primer_apellido'] = 'Campo obligatorio';
    if (!this.form.telefono) {
      this.errors['telefono'] = 'Campo obligatorio';
    } else if (!/^[0-9+\s]+$/.test(this.form.telefono)) {
      this.errors['telefono'] = 'Formato no válido (solo números, + y espacios)';
    }
    if (!this.form.email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(this.form.email)) {
      this.errors['email'] = 'Introduce un email válido';
    } else if (this.existingEmails.includes(this.form.email.trim().toLowerCase())) {
      this.errors['email'] = 'Este correo ya está registrado';
    }

    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ id: this.comercial!.id, ...this.form });
  }
}
