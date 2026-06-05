import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seleccionador, getColorFor, getInitials } from '../../../../models/seleccionador.model';

@Component({
  selector: 'app-sel-modal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sel-modal-detail.component.html',
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
    
    .empresa-tag {
      display: inline-block;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: #3730a3;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    
    .avatar-large {
      width: 60px; height: 60px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
      margin-bottom: 16px;
    }
    
    .empty-dash { color: #a1a1aa; font-weight: 400; }
    .field-disabled .detail-label { color: #9ca3af !important; }
    .field-disabled .detail-value,
    .field-disabled .empty-dash { color: #9ca3af !important; opacity: 0.8 !important; }
  `]
})
export class SelModalDetailComponent {
  @Input({ required: true }) seleccionador!: Seleccionador;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<number>();

  colorFor = getColorFor;
  initials = getInitials;

  get statusLabel(): string {
    return this.seleccionador.activo ? 'Activo' : 'De baja';
  }
}
