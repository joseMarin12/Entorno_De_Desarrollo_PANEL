import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component ({
    selector: 'app-stats-row',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stats-row.component.html'
})
export class StatsRowComponent {
    total = input(0);
    activos = input(0);
    inactivos = input(0);
}