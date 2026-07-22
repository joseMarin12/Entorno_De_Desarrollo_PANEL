import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Formacion } from '../../../../models/formacion.model';

@Component({
  selector: 'app-formaciones-modal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formaciones-modal-detail.component.html',
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

    .detail-section-title {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      color: var(--text-muted); font-weight: 700; margin: 20px 0 10px;
    }
  `]
})
export class FormacionesModalDetailComponent {
  @Input({ required: true }) formacion!: Formacion;
  @Input() responsableNombre = '';
  @Output() close = new EventEmitter<void>();

  get statusLabel(): string {
    return this.formacion.activo ? 'Activo' : 'Dado de baja';
  }

  formatDate(value: string | undefined): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
  }
}
