import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seleccionador } from '../../../../models/seleccionador.model';
import { SeleccionadoresService } from '../../../../services/seleccionadores.service';

@Component({
  selector: 'app-sel-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sel-table.component.html',
  styles: [`
    .badge-tipo-interno {
      background: #e8eaf6;
      color: #3949ab;
    }
    .badge-tipo-externo {
      background: #fff3e0;
      color: #e65100;
    }
    .td-dash {
      color: var(--text-muted);
      font-size: 12px;
    }
    .empresa-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .empresa-chip {
      display: inline-block;
      background: #f0f4ff;
      border: 1px solid #c5cae9;
      color: #3949ab;
      border-radius: 20px;
      padding: 2px 9px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    .action-btn:hover.detail { border-color: #7c6bba; background: #eeebff; }
  `]
})
export class SelTableComponent {
  @Input() seleccionadores: Seleccionador[] = [];
  @Input() currentPage   = 1;
  @Input() pageSize      = 6;
  @Input() totalFiltered = 0;

  @Output() detailClick  = new EventEmitter<number>();
  @Output() editClick    = new EventEmitter<number>();
  @Output() bajaClick    = new EventEmitter<number>();
  @Output() activarClick = new EventEmitter<number>();
  @Output() pageChange   = new EventEmitter<number>();

  svc = inject(SeleccionadoresService);

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get paginationInfo(): string {
    if (this.totalFiltered === 0) return 'Sin resultados';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end   = Math.min(this.currentPage * this.pageSize, this.totalFiltered);
    return `Mostrando ${start}–${end} de ${this.totalFiltered} seleccionadores`;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
