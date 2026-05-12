import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-row.component.html'
})
export class StatsRowComponent {
  @Input() total: number = 0;
  @Input() activas: number = 0;
  @Input() inactivas: number = 0;
}
