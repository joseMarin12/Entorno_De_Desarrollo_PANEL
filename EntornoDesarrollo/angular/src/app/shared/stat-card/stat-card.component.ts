import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS, IconName } from '../icons/icons';

export type CardColor = 'purple' | 'blue' | 'teal' | 'orange' | 'green' | 'red' | 'indigo';

const COLOR_MAP: Record<CardColor, { bg: string; color: string }> = {
  purple: { bg: 'rgba(90,77,154,0.12)', color: '#5a4d9a' },
  blue: { bg: 'rgba(71,111,171,0.12)', color: '#476fab' },
  teal: { bg: 'rgba(35,180,205,0.12)', color: '#23b4cd' },
  orange: { bg: 'rgba(243,156,18,0.12)', color: '#f39c12' },
  green: { bg: 'rgba(39,174,96,0.12)', color: '#27ae60' },
  red: { bg: 'rgba(231,76,60,0.12)', color: '#e74c3c' },
  indigo: { bg: 'rgba(85,86,158,0.12)', color: '#55569e' },
};

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card">
      <div class="stat-icon-wrap" [style.background]="iconBg()">
        <svg
          [attr.width]="size()"
          [attr.height]="size()"
          fill="none"
          stroke="currentColor"
          [attr.stroke-width]="strokeWidth()"
          viewBox="0 0 24 24"
          [style.color]="iconColor()"
          [innerHTML]="iconHtml()">
        </svg>
      </div>
      <div class="stat-body">
        <div class="stat-num">{{ value() }}</div>
        <div class="stat-label">{{ label() }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .stat-card {
      display: flex; align-items: center; gap: 14px;
      background: var(--card, #fff);
      border: 1px solid var(--border, #e4e6f0);
      border-radius: 14px; padding: 18px 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s, transform 0.2s;
      min-width: 0;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .stat-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-body { min-width: 0; }
    .stat-num { font-size: 24px; font-weight: 700; color: var(--text, #1e1b3a); line-height: 1.1; }
    .stat-label { font-size: 12px; color: var(--text-muted, #7a7a9a); margin-top: 2px; white-space: nowrap; }
  `],
})
export class StatCardComponent {
  private sanitizer = inject(DomSanitizer);

  /** Nombre del icono del catálogo shared/icons/icons.ts */
  icon = input.required<IconName>();
  /** Número o texto a mostrar en grande */
  value = input<number | string>(0);
  /** Etiqueta bajo el número */
  label = input.required<string>();
  /** Color del icono y su fondo */
  color = input<CardColor>('purple');
  /** Tamaño del SVG en px */
  size = input<number>(20);
  strokeWidth = input<number>(1.8);

  iconColor = computed(() => COLOR_MAP[this.color()].color);
  iconBg = computed(() => COLOR_MAP[this.color()].bg);
  iconHtml = computed((): SafeHtml =>
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.icon()] ?? '')
  );
}
