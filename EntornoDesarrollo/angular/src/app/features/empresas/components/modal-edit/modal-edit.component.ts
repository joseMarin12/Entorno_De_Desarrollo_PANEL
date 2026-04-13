import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../models/empresa.model';

@Component({
  selector: 'app-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',
})
export class ModalEditComponent implements OnChanges {
  @Input() empresa: Empresa | null = null;
  @Output() save  = new EventEmitter<Empresa>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', razonSocial: '', tipo: '', cif: '', direcciones: 0, contactos: 0, activo: true };
  errors: Record<string, string> = {};

  ngOnChanges(): void {
    if (this.empresa) {
      this.form = { ...this.empresa };
      this.errors = {};
    }
  }

  get subtitle(): string {
    if (!this.empresa) return '';
    return `Modificando datos de ${[this.empresa.nombre, this.empresa.razonSocial].join(' ')}`;
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.razonSocial) this.errors['razonSocial'] = 'Campo obligatorio';
    if (!this.form.cif) this.errors['cif'] = 'Campo obligatorio';
    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ id: this.empresa!.id, ...this.form });
  }
}