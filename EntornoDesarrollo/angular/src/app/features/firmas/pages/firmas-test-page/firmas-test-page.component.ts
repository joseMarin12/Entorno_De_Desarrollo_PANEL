import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { FirmasTableComponent } from '../../components/firmas-table/firmas-table.component';

@Component({
  selector: 'app-firmas-test-page',
  standalone: true,
  imports: [CommonModule, TopbarComponent, FirmasTableComponent],
  templateUrl: './firmas-test-page.component.html'
})
export class FirmasTestPageComponent {
  // Simulamos que estamos viendo el detalle del trabajador con ID 1
  trabajadorIdDummy = 1;
}
