import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa, getInitials, getColorFor } from '../../../../models/empresa.model';

@Component({
  selector: 'app-empresas-modal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas-modal-detail.component.html',
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .detail-item { margin-bottom: 20px; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
    .detail-value { font-size: 14px; color: var(--text); font-weight: 500; }

    .external-badge-info {
      background: #f8f9fd;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-top: 10px;
    }

    .avatar-large {
      width: 60px; height: 60px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
      margin-bottom: 16px;
    }
  `]
})
export class EmpresasModalDetailComponent {
  @Input({ required: true }) empresa!: Empresa;
  @Output() close = new EventEmitter<void>();

  get statusLabel(): string {
    return this.empresa.activo ? 'Activa' : 'Dada de baja';
  }

  get initials(): string {
    return getInitials(this.empresa);
  }

  get color(): string {
    return getColorFor(this.empresa.id ?? 0);
  }
}
