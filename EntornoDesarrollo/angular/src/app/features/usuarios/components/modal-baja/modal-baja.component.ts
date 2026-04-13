import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../../models/usuarios.model';
import { UsuariosService } from '../../../../services/usuarios.service';

@Component({
  selector: 'app-usuarios-modal-baja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-baja.component.html',
})
export class UsuariosModalBajaComponent implements OnChanges {
  @Input() usuario: Usuario | null = null;
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  svc = inject(UsuariosService);

  get isDarBaja(): boolean {
    return !!this.usuario?.enabled;
  }

  get modalTitle(): string {
    return this.isDarBaja ? 'Desactivar Usuario' : 'Activar Usuario';
  }

  get modalSubtitle(): string {
    return this.isDarBaja ? 'Esta acción es reversible' : 'El usuario volverá a estar activo';
  }

  get confirmTitle(): string {
    if (!this.usuario) return '';
    const name = this.svc.fullName(this.usuario);
    return this.isDarBaja ? `¿Desactivar a ${name}?` : `¿Activar a ${name}?`;
  }

  get confirmDesc(): string {
    if (!this.usuario) return '';
    const name = this.svc.fullName(this.usuario);
    return this.isDarBaja
      ? `El usuario <strong>${name}</strong> quedará marcado como <em>Inactivo</em> en el sistema. No se eliminarán sus datos.`
      : `El usuario <strong>${name}</strong> volverá a estar <em>Activo</em> y podrá acceder al sistema.`;
  }

  get infoText(): string {
    return this.isDarBaja
      ? 'El registro <strong>no se eliminará</strong> del sistema. Podrás reactivarlo en cualquier momento desde la lista de usuarios.'
      : 'El historial del usuario se mantendrá intacto tras la reactivación.';
  }

  ngOnChanges(): void {}
}
