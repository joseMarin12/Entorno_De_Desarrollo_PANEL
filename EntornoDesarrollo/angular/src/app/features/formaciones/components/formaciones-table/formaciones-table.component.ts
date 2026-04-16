import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Formacion } from '../../../../models/formacion.model';
import { FormacionesApiService } from '../../../../services/formaciones.service';

@Component({
  selector: 'app-formaciones-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formaciones-table.component.html',
})
export class FormacionesTableComponent {
  @Input() formaciones: Formacion[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() editClick = new EventEmitter<number>();
  @Output() bajaClick = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(FormacionesApiService);

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  title(formacion: Formacion): string {
    return formacion.curso || 'Sin título';
  }

  initials(formacion: Formacion): string {
    const t = this.title(formacion);
    return t.substring(0, 2).toUpperCase();
  }

  colorFor(id: number | string): string {
    const colors = [
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #6366f1, #4f46e5)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #db2777)'
    ];
    return colors[Number(id) % colors.length] || colors[0];
  }

  get paginationInfo(): string {
    if (this.totalFiltered === 0) return 'Sin resultados';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalFiltered);
    return `Mostrando ${start}–${end} de ${this.totalFiltered} formaciones`;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
