import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Seleccionador } from '../../../../models/seleccionador.model';

@Component({
  selector: 'app-sel-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sel-modal-form.component.html',
})
export class SelModalFormComponent implements OnChanges {
  /** null = modo añadir, Seleccionador = modo editar */
  @Input() seleccionador: Seleccionador | null = null;
  @Output() save  = new EventEmitter<Omit<Seleccionador, 'id'>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', ap1: '', ap2: '', activo: true };
  errors: Record<string, string> = {};

  get isEdit(): boolean { return this.seleccionador !== null; }

  get title(): string {
    return this.isEdit ? 'Editar Seleccionador' : 'Añadir Seleccionador';
  }

  get subtitle(): string {
    return this.isEdit
      ? 'Modifica los datos del seleccionador'
      : 'Rellena los datos del nuevo seleccionador';
  }

  ngOnChanges(): void {
    if (this.seleccionador) {
      this.form = {
        nombre: this.seleccionador.nombre,
        ap1:    this.seleccionador.ap1,
        ap2:    this.seleccionador.ap2,
        activo: this.seleccionador.activo,
      };
    } else {
      this.form = { nombre: '', ap1: '', ap2: '', activo: true };
    }
    this.errors = {};
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre.trim()) this.errors['nombre'] = 'Campo obligatorio';
    if (!this.form.ap1.trim())    this.errors['ap1']    = 'Campo obligatorio';
    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ ...this.form, nombre: this.form.nombre.trim(), ap1: this.form.ap1.trim(), ap2: this.form.ap2.trim() });
  }
}
