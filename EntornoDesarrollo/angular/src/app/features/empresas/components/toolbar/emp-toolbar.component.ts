import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EmpFilterType = '' | 'activa' | 'baja';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emp-toolbar.component.html',
})
export class EmpToolbarComponent {
  @Input() tipos: string[] = [];
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<EmpFilterType>();
  @Output() tipoFilterChange = new EventEmitter<string>();

  searchValue = '';
  filterValue: EmpFilterType = '';
  tipoFilterValue: string = '';
}
