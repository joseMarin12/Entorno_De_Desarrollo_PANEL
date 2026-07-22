import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asignacion } from '../../../../models/asignacion.model';

@Component({
  selector: 'app-asignaciones-modal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asignaciones-modal-detail.component.html',
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
  `]
})
export class AsignacionesModalDetailComponent {
  @Input({ required: true }) asignacion!: Asignacion;
  @Output() close = new EventEmitter<void>();

  get statusLabel(): string {
    return this.asignacion.activo !== false ? 'Activa' : 'Dada de baja';
  }

  get tarifaFormateada(): string {
    if (this.asignacion.tarifa == null) return '—';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(this.asignacion.tarifa);
  }
}
