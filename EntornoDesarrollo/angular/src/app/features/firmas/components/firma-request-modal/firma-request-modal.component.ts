import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FirmaRequestData {
  documento_nombre: string;
  requiere_rrhh: boolean;
  trabajador_email: string;
  trabajador_nombre: string;
}

@Component({
  selector: 'app-firma-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './firma-request-modal.component.html',
})
export class FirmaRequestModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitRequest = new EventEmitter<FirmaRequestData>();

  form: FirmaRequestData = {
    documento_nombre: 'Contrato_Prueba.pdf', // Valor por defecto para pruebas
    requiere_rrhh: true,
    trabajador_email: 'correo_prueba_trabajador@sgtech.tech',
    trabajador_nombre: 'Juan Trabajador'
  };

  errors: Record<string, string> = {};

  toggleRrhh(): void {
    this.form.requiere_rrhh = !this.form.requiere_rrhh;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.documento_nombre) this.errors['documento_nombre'] = 'El nombre del documento es obligatorio';
    if (!this.form.trabajador_email) this.errors['trabajador_email'] = 'El correo del trabajador es obligatorio';

    if (Object.keys(this.errors).length > 0) return;

    this.submitRequest.emit({ ...this.form });
    this.reset();
  }

  reset(): void {
    this.form = {
      documento_nombre: 'Contrato_Prueba.pdf',
      requiere_rrhh: true,
      trabajador_email: 'correo_prueba_trabajador@sgtech.tech',
      trabajador_nombre: 'Juan Trabajador'
    };
    this.errors = {};
  }
}
