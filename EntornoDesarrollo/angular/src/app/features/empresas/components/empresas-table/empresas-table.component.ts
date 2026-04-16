import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Empresa } from '../../../../models/empresa.model';
import { EmpresasService } from '../../../../services/empresas.service';

@Component({
  selector: 'app-empresas-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas-table.component.html',
})
export class EmpresasTableComponent {
  private readonly router = inject(Router);
  @Input() empresas: Empresa[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() editClick  = new EventEmitter<number>();
  @Output() bajaClick  = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(EmpresasService);

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get paginationInfo(): string {
    if (this.totalFiltered === 0) return 'Sin resultados';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end   = Math.min(this.currentPage * this.pageSize, this.totalFiltered);
    return `Mostrando ${start}–${end} de ${this.totalFiltered} empresas`;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToDirecciones(id: number): void {
    this.router.navigate(['/empresas', id, 'direcciones']);
  }

  goToContactos(id: number): void {
    this.router.navigate(['/empresas', id, 'contactos']);
  } 
}