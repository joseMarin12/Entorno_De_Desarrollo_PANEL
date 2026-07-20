import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Empresa } from '../../../../models/empresa.model';


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

  readonly empresa = (id: number) => this.empresas.find(e => e.id === id);

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

  fullName(e: Empresa): string {
    return [e.nombre, e.razonSocial].filter(Boolean).join(' ');
  }

  initials(e: Empresa): string {
    return (e.nombre[0] + e.nombre[1]).toUpperCase();
  }  

  goToDirecciones(id: number): void {
    const empresa = this.empresa(id);
    this.router.navigate(['/empresas', id, 'direcciones'], {
      state: { nombreEmpresa: this.fullName(empresa!) }
    });
  }

  goToContactos(id: number): void {
    const empresa = this.empresa(id);
    this.router.navigate(['/empresas', id, 'contactos'], {
      state: { nombreEmpresa: this.fullName(empresa!) }
    });
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