import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trabajador, getColorFor, getInitials } from '../../../../models/trabajador.model';

// Interface para datos mock de formación del trabajador
export interface FormacionTrabajadorDetail {
  id: number;
  curso: string;
  estado: string;
  area: string;
  modalidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  asistencia: boolean | null;
  eficacia: string | null;
}

// ═══ MOCK: Formaciones del trabajador ═══
const MOCK_FORMACIONES: FormacionTrabajadorDetail[] = [
  {
    id: 1, curso: 'Prevención de Riesgos Laborales',
    estado: 'Finalizada', area: 'Seguridad', modalidad: 'Presencial',
    fecha_inicio: '2025-01-15', fecha_fin: '2025-02-28',
    asistencia: true, eficacia: 'Alta'
  },
  {
    id: 2, curso: 'Angular Avanzado',
    estado: 'En curso', area: 'Técnica', modalidad: 'Online',
    fecha_inicio: '2026-03-01', fecha_fin: '2026-06-30',
    asistencia: null, eficacia: null
  },
  {
    id: 3, curso: 'Liderazgo y Gestión de Equipos',
    estado: 'Planificada', area: 'Gestión y liderazgo', modalidad: 'Semipresencial',
    fecha_inicio: '2026-07-01', fecha_fin: '2026-09-15',
    asistencia: null, eficacia: null
  }
];

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
    .tab-soon {
      background: #fff3e0; color: #e65100; border-radius: 10px;
      padding: 2px 7px; font-size: 10px; margin-left: 6px; font-weight: 600;
    }

    .empty-tab {
      padding: 40px 20px; text-align: center; color: var(--text-muted);
      background: #f9fafb; border-radius: 12px; border: 1px dashed var(--border);
    }
    .empty-tab svg { margin-bottom: 12px; opacity: 0.4; }
    .empty-tab h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
    .empty-tab p { font-size: 12px; }

    /* ═══ FORMACIONES TAB ═══ */
    .form-summary {
      display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .summary-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
      border: 1px solid var(--border); background: var(--card);
    }
    .summary-chip .chip-num { font-size: 16px; font-weight: 700; }
    .summary-chip.total { color: var(--text); }
    .summary-chip.finished { color: #1a7a45; border-color: #c8e6c9; background: #e8f5e9; }
    .summary-chip.ongoing { color: #1565c0; border-color: #bbdefb; background: #e3f2fd; }
    .summary-chip.planned { color: #e65100; border-color: #ffccbc; background: #fff3e0; }

    .form-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 10px;
      transition: box-shadow 0.15s;
    }
    .form-card:last-child { margin-bottom: 0; }
    .form-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

    .form-card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .form-card-title { font-size: 14px; font-weight: 600; color: var(--text); }

    .form-card-badges { display: flex; gap: 6px; flex-wrap: wrap; }

    .mini-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 14px; font-size: 10px; font-weight: 600;
    }
    .mini-badge.estado-finalizada { background: #e8f5e9; color: #1a7a45; }
    .mini-badge.estado-en-curso   { background: #e3f2fd; color: #1565c0; }
    .mini-badge.estado-planificada { background: #fff3e0; color: #e65100; }
    .mini-badge.estado-cancelada  { background: #fdecea; color: #b71c1c; }
    .mini-badge.estado-default    { background: #f5f5f5; color: #757575; }
    .mini-badge.area   { background: #f3e5f5; color: #7b1fa2; }
    .mini-badge.modo   { background: #e0f7fa; color: #00695c; }

    .form-card-details {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
    }
    .form-detail-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; color: var(--text-muted); font-weight: 700; margin-bottom: 2px; }
    .form-detail-value { font-size: 13px; color: var(--text); font-weight: 500; }
    .asistencia-yes { color: #1a7a45; }
    .asistencia-no  { color: #b71c1c; }
    .asistencia-pending { color: var(--text-muted); font-style: italic; }
  `]
})
export class TrabModalDetailComponent {
  @Input({ required: true }) trabajador!: Trabajador;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<number>();

  activeTab = signal<'datos' | 'formaciones'>('datos');

  // Mock data
  mockFormaciones = MOCK_FORMACIONES;

  colorFor = getColorFor;
  initials = getInitials;

  setTab(tab: 'datos' | 'formaciones') {
    this.activeTab.set(tab);
  }

  get statusLabel(): string {
    return this.trabajador.activo ? 'Activo' : 'De baja';
  }

  get tipoLabel(): string {
    return this.trabajador.freelance ? 'Freelance' : 'Plantilla';
  }

  // Helpers para formaciones
  get totalFormaciones(): number { return this.mockFormaciones.length; }
  get finalizadas(): number { return this.mockFormaciones.filter(f => f.estado === 'Finalizada').length; }
  get enCurso(): number { return this.mockFormaciones.filter(f => f.estado === 'En curso').length; }
  get planificadas(): number { return this.mockFormaciones.filter(f => f.estado === 'Planificada').length; }

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
