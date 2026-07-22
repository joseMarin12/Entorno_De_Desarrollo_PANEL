import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comercial } from '../../../../models/comercial.model';

@Component({
  selector: 'app-comerciales-modal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comerciales-modal-detail.component.html',
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
export class ComercialesModalDetailComponent {
  @Input({ required: true }) comercial!: Comercial;
  @Input() color = '#5a4d9a';
  @Output() close = new EventEmitter<void>();

  get statusLabel(): string {
    return this.comercial.activo ? 'Activo' : 'De baja';
  }

  get initials(): string {
    return ((this.comercial.nombre?.[0] ?? '') + (this.comercial.primer_apellido?.[0] ?? '')).toUpperCase();
  }

  get fullName(): string {
    return [this.comercial.nombre, this.comercial.primer_apellido, this.comercial.segundo_apellido].filter(Boolean).join(' ');
  }
}
