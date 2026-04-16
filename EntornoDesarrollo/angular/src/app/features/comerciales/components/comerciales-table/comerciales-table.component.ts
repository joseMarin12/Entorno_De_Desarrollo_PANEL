import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comercial } from '../../../../models/comercial.model';

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

  fullName(c: Comercial): string {
    return [c.nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean).join(' ');
  }

  initials(c: Comercial): string {
    return (c.nombre[0] + c.primer_apellido[0]).toUpperCase();
  }

  colorFor(id: number): string {
    const COLORS = [
      'linear-gradient(135deg,#5a4d9a,#476fab)',
      'linear-gradient(135deg,#476fab,#23b4cd)',
      'linear-gradient(135deg,#3198bf,#23b4cd)',
      'linear-gradient(135deg,#55569e,#3198bf)',
      'linear-gradient(135deg,#5a4d9a,#23b4cd)',
    ];
    return COLORS[(id - 1) % COLORS.length];
  }
}
