import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trab-stats-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-row trab-stats-row">

      <!-- Total registrados -->
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ total() }}</div>
          <div class="stat-label">Total registrados</div>
        </div>
      </div>

      <!-- Activos -->
      <div class="stat-card">
        <div class="stat-icon teal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ activos() }}</div>
          <div class="stat-label">Activos</div>
        </div>
      </div>

      <!-- De baja -->
      <div class="stat-card">
        <div class="stat-icon" style="background:#fdecea; color:#b71c1c;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ inactivos() }}</div>
          <div class="stat-label">De baja</div>
        </div>
      </div>

      <!-- Freelance -->
      <div class="stat-card">
        <div class="stat-icon" style="background:#e3f2fd; color:#1565c0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div>
          <div class="stat-num">{{ freelances() }}</div>
          <div class="stat-label">Freelance</div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .trab-stats-row {
      grid-template-columns: repeat(4, 1fr);
    }
    @media (max-width: 1024px) {
      .trab-stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .trab-stats-row { grid-template-columns: 1fr; }
    }
  `]
})
export class TrabStatsRowComponent {
  total = input(0);
  activos = input(0);
  inactivos = input(0);
  freelances = input(0);
}
