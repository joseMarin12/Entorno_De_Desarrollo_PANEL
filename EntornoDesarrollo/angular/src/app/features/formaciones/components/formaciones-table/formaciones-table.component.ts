import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Formacion } from '../../../../models/formacion.model';
import { FormacionesService } from '../../../../services/formaciones.service';

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

  @Output() editClick  = new EventEmitter<number>();
  @Output() bajaClick  = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(FormacionesService);

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get paginationInfo(): string {
    if (this.totalFiltered === 0) return 'Sin resultados';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end   = Math.min(this.currentPage * this.pageSize, this.totalFiltered);
    return `Mostrando ${start}–${end} de ${this.totalFiltered} formaciones`;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
