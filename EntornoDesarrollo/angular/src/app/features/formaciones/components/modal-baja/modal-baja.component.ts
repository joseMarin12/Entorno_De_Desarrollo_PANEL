import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Formacion } from '../../../../models/formacion.model';

@Component({
  selector: 'app-modal-baja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-baja.component.html'
})
export class ModalBajaComponent {
  // 1. Recibe la formación
  @Input() formacion!: Formacion | null;

  // 2. Eventos de salida
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // 3. Variable base
  get isDarBaja(): boolean {
    return this.formacion?.activo === true;
  }

  // --- LAS DOS VARIABLES NUEVAS QUE PEDÍA EL HTML ---

  // Subtítulo pequeño de la ventana
  get modalSubtitle(): string {
    return this.isDarBaja ? 'Desactivar Formación' : 'Reactivar Formación';
  }

  // Título grande de la zona de confirmación
  get confirmTitle(): string {
    return this.isDarBaja ? 'Confirmar Baja' : 'Confirmar Reactivación';
  }

  // ---------------------------------------------------

  // Texto principal (con negritas)
  get confirmDesc(): string {
    if (!this.formacion) return '';
    const nombre = this.formacion.curso || 'esta formación';

    if (this.isDarBaja) {
      return `¿Estás seguro de que deseas dar de baja <strong>${nombre}</strong>?`;
    } else {
      return `¿Estás seguro de que deseas reactivar <strong>${nombre}</strong>?`;
    }
  }

  // Cuadrito de información final
  get infoText(): string {
    if (this.isDarBaja) {
      return 'Al dar de baja, la formación dejará de contar para las estadísticas de formaciones activas y pasará al historial.';
    } else {
      return 'Al reactivar, la formación volverá a aparecer en los listados principales como activa.';
    }
  }
  // Título grande de la ventana modal
  get modalTitle(): string {
    return this.isDarBaja ? 'Dar de baja' : 'Reactivar';
  }
}