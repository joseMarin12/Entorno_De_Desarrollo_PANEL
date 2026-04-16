import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seleccionador } from '../../../../models/seleccionador.model';

export type ConfirmMode = 'baja' | 'activar';

@Component({
  selector: 'app-sel-modal-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sel-modal-confirm.component.html',
  styles: [`
    .sel-confirm-modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      overflow: hidden;
      animation: selModalIn 0.25s ease forwards;
    }
    @keyframes selModalIn {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .sel-confirm-bar {
      height: 5px;
      width: 100%;
    }

    .sel-confirm-body {
      padding: 32px 28px 20px;
      text-align: center;
    }

    .sel-confirm-icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    .sel-confirm-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sel-confirm-title {
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #1e1b3a;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .sel-confirm-desc {
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      color: #7a7a9a;
      line-height: 1.7;
    }
    .sel-confirm-desc strong {
      color: #1e1b3a;
    }

    .sel-confirm-footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 1px solid #e4e6f0;
    }

    .sel-confirm-btn {
      padding: 16px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background 0.15s;
    }
    .sel-confirm-btn-cancel {
      color: #7a7a9a;
      border-right: 1px solid #e4e6f0;
    }
    .sel-confirm-btn-cancel:hover {
      background: #f4f6fb;
    }
    .sel-confirm-btn-danger {
      color: #dc2626;
    }
    .sel-confirm-btn-danger:hover {
      background: #fef2f2;
    }
    .sel-confirm-btn-success {
      color: #059669;
    }
    .sel-confirm-btn-success:hover {
      background: #ecfdf5;
    }
  `],
})
export class SelModalConfirmComponent {
  @Input() seleccionador: Seleccionador | null = null;
  @Input() mode: ConfirmMode = 'baja';
  @Output() confirm = new EventEmitter<void>();
  @Output() close   = new EventEmitter<void>();

  get isBaja(): boolean { return this.mode === 'baja'; }

  get name(): string {
    if (!this.seleccionador) return '';
    return `${this.seleccionador.nombre} ${this.seleccionador.primer_apellido}`;
  }
}
