import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeleccionadoresService } from '../../../../services/seleccionadores.service';

@Component({
  selector: 'app-sel-stats-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 20h5v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2h5"/><circle cx="12" cy="8" r="4"/>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ svc.total() }}</div>
          <div class="stat-label">Total seleccionadores</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon teal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ svc.activos() }}</div>
          <div class="stat-label">Activos</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:#fdecea; color:#b71c1c;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ svc.inactivos() }}</div>
          <div class="stat-label">Dados de baja</div>
        </div>
      </div>
    </div>
  `,
})
export class SelStatsRowComponent {
  svc = inject(SeleccionadoresService);
}
