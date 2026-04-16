import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Formacion } from '../../../../models/formacion.model'; // <-- La ruta exacta según tu árbol

@Component({
  selector: 'app-modal-baja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-baja.component.html'
})
export class ModalBajaComponent {
  // 1. Declaramos que este componente recibe una formación desde el padre
  @Input() formacion!: Formacion | null;

  // 2. Eventos para avisar al padre si el usuario confirma o cancela
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}