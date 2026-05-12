import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asignacion } from '../../../../models/asignacion.model';
import { AsignacionesService } from '../../../../services/asignaciones.service';
import { LookupSelectComponent } from '../../../../shared/lookup-select/lookup-select.component';

@Component({
  selector: 'app-modal-asignacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LookupSelectComponent],
  templateUrl: './modal-asignacion.component.html',
})
export class ModalAsignacionComponent implements OnInit {
  @Input() asignacion: Asignacion | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Omit<Asignacion, 'id'>>();

  svc = inject(AsignacionesService);

  isEdit = false;
  form: Partial<Asignacion> = {};
  errors: Record<string, string> = {};

  ngOnInit(): void {
    if (this.asignacion && this.asignacion.id) {
      this.isEdit = true;
      this.form = { ...this.asignacion };
      
      // Asegurarse de que las fechas tengan formato YYYY-MM-DD para el input type="date"
      if (this.form.fecha_ini) {
        this.form.fecha_ini = this.formatDateForInput(this.form.fecha_ini);
      }
      if (this.form.fecha_fin) {
        this.form.fecha_fin = this.formatDateForInput(this.form.fecha_fin);
      }
    } else {
      this.isEdit = false;
      this.form = {};
    }
  }

  formatDateForInput(dateStr: string): string {
    // Si viene como "YYYY-MM-DDTHH:MM:SS..." de PG, extraemos la primera parte
    if (!dateStr) return '';
    return dateStr.substring(0, 10);
  }

  submit(): void {
    this.errors = {};
    if (!this.form.id_empresa) this.errors['id_empresa'] = 'La empresa es obligatoria';
    if (!this.form.id_trabajador) this.errors['id_trabajador'] = 'El trabajador es obligatorio';
    if (!this.form.id_comerciales) this.errors['id_comerciales'] = 'El comercial es obligatorio';
    if (!this.form.fecha_ini) this.errors['fecha_ini'] = 'La fecha de inicio es obligatoria';
    if (this.form.tarifa == null || this.form.tarifa.toString().trim() === '') this.errors['tarifa'] = 'La tarifa es obligatoria';

    if (Object.keys(this.errors).length > 0) return;

    // Remove view-only fields before sending to API
    const dataToSend = { ...this.form };
    delete dataToSend.empresa_nombre;
    delete dataToSend.trabajador_nombre;
    delete dataToSend.comercial_nombre;

    this.save.emit(dataToSend as Omit<Asignacion, 'id'>);
  }
}
