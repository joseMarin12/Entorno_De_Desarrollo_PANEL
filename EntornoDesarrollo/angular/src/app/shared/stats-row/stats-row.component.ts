import { Component, input } from '@angular/core';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { IconName } from '../icons/icons';
import { CardColor } from '../stat-card/stat-card.component';

export interface StatCardConfig {
  icon: IconName;
  value: number | string;
  label: string;
  color: CardColor;
}


@Component({
  selector: 'app-stats-row',
  standalone: true,
  imports: [StatCardComponent],
  template: `
    <div class="stats-row">
      @for (card of cards(); track card.label) {
        <app-stat-card
          [icon]="card.icon"
          [value]="card.value"
          [label]="card.label"
          [color]="card.color" />
      }
    </div>
  `,
  styles: [`
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
  `],
})
export class StatsRowComponent {
  cards = input.required<StatCardConfig[]>();
}
