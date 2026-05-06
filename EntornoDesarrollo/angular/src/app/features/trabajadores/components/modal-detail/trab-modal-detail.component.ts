import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trabajador, getColorFor, getInitials } from '../../../../models/trabajador.model';

@Component({
  selector: 'app-trab-modal-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trab-modal-detail.component.html',
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .detail-item { margin-bottom: 0; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
    .detail-value { font-size: 14px; color: var(--text); font-weight: 500; }
    
    .avatar-large {
      width: 60px; height: 60px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    
    .empty-dash { color: #a1a1aa; font-weight: 400; }
    
    .section-box {
      background: #f8f9fd;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 20px;
    }
    .section-box-title {
      font-size: 12px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 16px; display: block;
    }

    .tabs-nav {
      display: flex; border-bottom: 1px solid var(--border);
      margin-bottom: 24px; gap: 0;
    }
    .tab-item {
      padding: 10px 18px; color: var(--text-muted); font-weight: 600;
      font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .tab-item:hover { color: var(--text); }
    .tab-item.active {
      color: var(--purple-dark);
      border-bottom-color: var(--purple-dark);
    }
    .tab-count {
      background: #e8eaf6; color: var(--purple-dark); border-radius: 10px; padding: 2px 7px;
      font-size: 10px; margin-left: 6px; font-weight: 700;
    }

    .empty-tab {
      padding: 40px 20px; text-align: center; color: var(--text-muted);
      background: #f9fafb; border-radius: 12px; border: 1px dashed var(--border);
    }
    .empty-tab svg { margin-bottom: 12px; opacity: 0.4; }
    .empty-tab h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
    .empty-tab p { font-size: 12px; }
  `]
})
export class TrabModalDetailComponent {
  @Input({ required: true }) trabajador!: Trabajador;
  @Input() asignaciones: any[] = [];
  @Input() formaciones: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<number>();

  activeTab = signal<'datos' | 'asignaciones' | 'formaciones'>('datos');

  colorFor = getColorFor;
  initials = getInitials;

  setTab(tab: 'datos' | 'asignaciones' | 'formaciones') {
    this.activeTab.set(tab);
  }

  get statusLabel(): string {
    return this.trabajador.activo ? 'Activo' : 'De baja';
  }

  get tipoLabel(): string {
    return this.trabajador.freelance ? 'Freelance' : 'Plantilla';
  }

  // Helpers para formaciones
  get totalFormaciones(): number { return this.formaciones.length; }
  get finalizadas(): number { return this.formaciones.filter(f => f.estado === 'Finalizada').length; }
  get enCurso(): number { return this.formaciones.filter(f => f.estado === 'En curso').length; }

  // Helpers para asignaciones
  get totalAsignaciones(): number { return this.asignaciones.length; }
  get asignacionesActivas(): number { return this.asignaciones.filter(a => a.activo).length; }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Finalizada': 'estado-finalizada',
      'En curso': 'estado-en-curso',
      'Planificada': 'estado-planificada',
      'Cancelada': 'estado-cancelada'
    };
    return map[estado] ?? 'estado-default';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
