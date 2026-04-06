import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="topbar">
      <div class="topbar-left">
        <!-- Botón hamburguesa — solo visible en móvil -->
        <button class="icon-btn hamburger-btn" (click)="ui.toggleSidebar()" aria-label="Abrir menú">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="breadcrumb">
          <span>Inicio</span>
          <span class="breadcrumb-sep">›</span>
          <span class="current">{{ pageTitle }}</span>
        </div>
      </div>
      <div class="topbar-right">
        <button class="icon-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <div class="user-avatar" style="width:36px;height:36px;border-radius:9px;font-size:13px;">AM</div>
      </div>
    </div>
  `,
})
export class TopbarComponent {
  @Input() pageTitle = 'Inicio';
  ui = inject(UiService);
}
