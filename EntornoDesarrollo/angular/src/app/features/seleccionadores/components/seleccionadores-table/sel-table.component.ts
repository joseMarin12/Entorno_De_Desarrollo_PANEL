import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seleccionador } from '../../../../models/seleccionador.model';
import { SeleccionadoresService } from '../../../../services/seleccionadores.service';

@Component({
  selector: 'app-sel-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sel-table.component.html',
})
export class SelTableComponent {
  @Input() seleccionadores: Seleccionador[] = [];
  @Input() currentPage  = 1;
  @Input() pageSize     = 6;
  @Input() totalFiltered = 0;

  @Output() editClick   = new EventEmitter<number>();
  @Output() bajaClick   = new EventEmitter<number>();
  @Output() activarClick = new EventEmitter<number>();
  @Output() pageChange  = new EventEmitter<number>();

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
