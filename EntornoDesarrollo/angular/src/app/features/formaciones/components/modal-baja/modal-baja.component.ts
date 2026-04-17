import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Formacion } from '../../../../models/formacion.model';

@Component({
  selector: 'app-modal-baja',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay open">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title">{{ formacion.id_estado === 1 ? 'Dar de baja' : 'Reactivar' }}</div>
          <button class="modal-close" (click)="close.emit()">×</button>
        </div>
        <div class="modal-body confirm-body">
          <p>¿Estás seguro de que deseas {{ formacion.id_estado === 1 ? 'dar de baja' : 'reactivar' }} a <strong>{{ formacion.curso }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="close.emit()">Cancelar</button>
          <button class="btn btn-primary" (click)="confirm.emit()">Confirmar</button>
        </div>
      </div>
    </div>
  `
})
export class ModalBajaComponent {
  @Input({ required: true }) formacion!: Formacion;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
