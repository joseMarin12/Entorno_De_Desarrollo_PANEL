import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa } from '../../../../models/empresa.model';
import { EmpresasService } from '../../../../services/empresas.service';

@Component({
  selector: 'app-modal-baja',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-baja.component.html',
  styles: [`
    .com-confirm-modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      overflow: hidden;
      animation: comModalIn 0.25s ease forwards;
    }
    @keyframes comModalIn {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .com-confirm-bar {
      height: 5px;
      width: 100%;
    }

    .com-confirm-body {
      padding: 32px 28px 20px;
      text-align: center;
    }

    .com-confirm-icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    .com-confirm-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .com-confirm-title {
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #1e1b3a;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .com-confirm-desc {
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      color: #7a7a9a;
      line-height: 1.7;
    }
    .com-confirm-desc strong {
      color: #1e1b3a;
    }

    .com-confirm-footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 1px solid #e4e6f0;
    }

    .com-confirm-btn {
      padding: 16px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background 0.15s;
    }
    .com-confirm-btn-cancel {
      color: #7a7a9a;
      border-right: 1px solid #e4e6f0;
    }
    .com-confirm-btn-cancel:hover {
      background: #f4f6fb;
    }
    .com-confirm-btn-danger {
      color: #dc2626;
    }
    .com-confirm-btn-danger:hover {
      background: #fef2f2;
    }
    .com-confirm-btn-success {
      color: #059669;
    }
    .com-confirm-btn-success:hover {
      background: #ecfdf5;
    }
  `],
})
export class ModalBajaComponent implements OnChanges {
  @Input() empresa: Empresa | null = null;
  @Output() confirm = new EventEmitter<void>();
  @Output() close   = new EventEmitter<void>();

  svc = inject(EmpresasService);

  get isDarBaja(): boolean {
    return !!this.empresa?.activo;
  }

  get modalTitle(): string {
    return this.isDarBaja ? 'Dar de Baja' : 'Reactivar Empresa';
  }

  get modalSubtitle(): string {
    return this.isDarBaja ? 'Esta acción es reversible' : 'La empresa volverá a estar activa';
  }

  get confirmTitle(): string {
    if (!this.empresa) return '';
    const name = this.svc.fullName(this.empresa);
    return this.isDarBaja ? `¿Dar de baja a ${name}?` : `¿Reactivar a ${name}?`;
  }

  get confirmDesc(): string {
    if (!this.empresa) return '';
    const name = this.svc.fullName(this.empresa);
    return this.isDarBaja
      ? `La empresa <strong>${name}</strong> quedará marcada como <em>Inactiva</em> en el sistema. No se eliminarán sus datos.`
      : `La empresa <strong>${name}</strong> volverá a estar <em>Activa</em>.`;
  }

  get infoText(): string {
    return this.isDarBaja
      ? 'El registro <strong>no se eliminará</strong> del sistema. Podrás reactivarlo en cualquier momento desde la lista de empresas.'
      : 'El historial de la empresa se mantendrá intacto tras la reactivación.';
  }

  ngOnChanges(): void {}
}
