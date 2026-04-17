import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../../models/usuarios.model';
import { UsuariosService } from '../../../../services/usuarios.service';

@Component({
  selector: 'app-usuarios-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-table.component.html',
  styles: [`
    .action-btn:hover.detail { border-color: #7c6bba; background: #eeebff; }
  `]
})
export class UsuariosTableComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() detailClick = new EventEmitter<number>();
  @Output() editClick = new EventEmitter<number>();
  @Output() bajaClick = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(UsuariosService);

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get paginationInfo(): string {
    if (this.totalFiltered === 0) return 'Sin resultados';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalFiltered);
    return `Mostrando ${start}–${end} de ${this.totalFiltered} usuarios`;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
