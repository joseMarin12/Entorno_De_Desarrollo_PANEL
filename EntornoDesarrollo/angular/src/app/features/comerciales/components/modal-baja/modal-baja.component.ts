import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comercial } from '../../../../models/comercial.model';
import { ComercialesService } from '../../../../services/comerciales.service';

@Component({
  selector: 'app-modal-baja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-baja.component.html',
})
export class ModalBajaComponent implements OnChanges {
  @Input() comercial: Comercial | null = null;
  @Output() confirm = new EventEmitter<void>();
  @Output() close   = new EventEmitter<void>();

  svc = inject(ComercialesService);

  get isDarBaja(): boolean {
    return !!this.comercial?.activo;
  }

  get modalTitle(): string {
    return this.isDarBaja ? 'Dar de Baja' : 'Reactivar Comercial';
  }

  get modalSubtitle(): string {
    return this.isDarBaja ? 'Esta acción es reversible' : 'El comercial volverá a estar activo';
  }

  get confirmTitle(): string {
    if (!this.comercial) return '';
    const name = this.svc.fullName(this.comercial);
    return this.isDarBaja ? `¿Dar de baja a ${name}?` : `¿Reactivar a ${name}?`;
  }

  get confirmDesc(): string {
    if (!this.comercial) return '';
    const name = this.svc.fullName(this.comercial);
    return this.isDarBaja
      ? `El comercial <strong>${name}</strong> quedará marcado como <em>Inactivo</em> en el sistema. No se eliminarán sus datos.`
      : `El comercial <strong>${name}</strong> volverá a estar <em>Activo</em> y podrá ser asignado a empresas.`;
  }

  get infoText(): string {
    return this.isDarBaja
      ? 'El registro <strong>no se eliminará</strong> del sistema. Podrás reactivarlo en cualquier momento desde la lista de comerciales.'
      : 'El historial del comercial se mantendrá intacto tras la reactivación.';
  }

  ngOnChanges(): void {}
}
