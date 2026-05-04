import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Formacion } from '../../../../models/formacion.model';
import { FormacionesService } from '../../../../services/formaciones.service';
import { LookupSelectComponent } from '../../../../shared/lookup-select/lookup-select.component';
import { AreaStore } from '../../../../services/stores/area.store';
import { ModalidadStore } from '../../../../services/stores/modalidad.store';
import { EjecucionStore } from '../../../../services/stores/ejecucion.store';

@Component({
  selector: 'app-modal-formacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LookupSelectComponent],
  templateUrl: './modal-formacion.component.html',
})
export class ModalFormacionComponent implements OnInit {
  svc = inject(FormacionesService);
  readonly areaStore = inject(AreaStore);
  readonly modalidadStore = inject(ModalidadStore);
  readonly ejecucionStore = inject(EjecucionStore);

  @Input() formacion?: Formacion; // Si se pasa, es modo edición
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  isEdit = false;
  form: any;
  errors: { [key: string]: string } = {};

  ngOnInit(): void {
    this.areaStore.ensureLoaded().subscribe();
    this.modalidadStore.ensureLoaded().subscribe();
    this.ejecucionStore.ensureLoaded().subscribe();

    this.isEdit = !!this.formacion;

    if (this.isEdit && this.formacion) {
      this.form = { ...this.formacion };
    } else {
      this.form = {
        id_estado: 1,
        curso: '',
        denominacion: '',
        motivo: '',
        id_area: 0,
        recursos: '',
        id_responsable: 0,
        id_modalidad: 0,
        duracion: 0,
        dentro_fuera_jornada: '',
        observaciones: '',
        fecha_prevista: '',
        fecha_inicio: '',
        fecha_fin: '',
        horario: '',
        id_ejecucion: 0,
        eficacia: '',
        anio: new Date().getFullYear(),
        coste: 0,
        bonificacion: 0,
        total: 0,
        activo: true
      };
    }
  }

  calculateTotal(): void {
    this.form.total = (this.form.coste || 0) - (this.form.bonificacion || 0);
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.curso) this.errors['curso'] = 'El nombre del curso es obligatorio';
    if (!this.form.denominacion) this.errors['denominacion'] = 'La denominación es obligatoria';
    if (!this.form.id_area) this.errors['id_area'] = 'El área es obligatoria';
    if (!this.form.id_modalidad) this.errors['id_modalidad'] = 'La modalidad es obligatoria';
    if (!this.form.id_ejecucion) this.errors['id_ejecucion'] = 'La ejecución es obligatoria';
    if (!this.form.id_responsable) this.errors['id_responsable'] = 'El responsable es obligatorio';

    return Object.keys(this.errors).length === 0;
  }

  submit(): void {
    if (this.validate()) {
      this.save.emit(this.form);
    }
  }
}
