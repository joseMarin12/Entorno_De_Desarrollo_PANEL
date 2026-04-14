import { Component, computed, input, output } from '@angular/core';

export enum ConfirmMode {
  ACTIVAR = 'ACTIVAR',
  DESACTIVAR = 'DESACTIVAR'
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})

export class ConfirmationModalComponent {
  name = input<string>('item');
  title = input<string>('¿Seguro que quiere realizar esta acción?');
  description = input<string | null>(null);
  cancelarButtonTitle = input<string>('Cancelar');
  desactivarButtonTitle = input<string>('Dar de baja');
  activarButtonTitle = input<string>('Activar');

  mode = input<ConfirmMode>(ConfirmMode.DESACTIVAR);
  confirm = output<void>();
  closed = output<void>();

  isDesactivar = computed<boolean>(() => this.mode() === ConfirmMode.DESACTIVAR);

  confirmClicked(): void {
    console.log('confirmClicked', this.name());
    this.confirm.emit();
  }
}
