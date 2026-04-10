import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comercial } from '../../../../models/comercial.model';
import { ComercialesService } from '../../../../services/comerciales.service';

@Component({
  selector: 'app-comerciales-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comerciales-table.component.html',
})
export class ComercialesTableComponent {
  @Input() comerciales: Comercial[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() editClick  = new EventEmitter<number>();
  @Output() bajaClick  = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(ComercialesService);

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get paginationInfo(): string {
    if (this.totalFiltered === 0) return 'Sin resultados';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end   = Math.min(this.currentPage * this.pageSize, this.totalFiltered);
    return `Mostrando ${start}–${end} de ${this.totalFiltered} comerciales`;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
