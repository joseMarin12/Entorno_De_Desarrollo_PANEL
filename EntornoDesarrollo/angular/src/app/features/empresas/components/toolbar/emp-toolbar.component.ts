import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EmpFilterType = '' | 'tecnología' | 'consultoría' | 'activa' | 'baja';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emp-toolbar.component.html',
})
export class EmpToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<EmpFilterType>();

  searchValue = '';
  filterValue: EmpFilterType = '';
}