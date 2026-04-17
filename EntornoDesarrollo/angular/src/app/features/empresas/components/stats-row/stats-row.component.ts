import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresasService } from '../../../../services/empresas.service';

@Component({
  selector: 'app-stats-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-row.component.html'
})
export class StatsRowComponent {
  svc = inject(EmpresasService);
}