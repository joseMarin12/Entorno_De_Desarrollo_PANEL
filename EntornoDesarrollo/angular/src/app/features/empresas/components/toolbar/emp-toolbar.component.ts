import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EmpFilterType = '' | 'activa' | 'baja';
export type EmpFilterTipoType = '' | 'Tecnología' | 'Consultoría' | 'Servicios' ;

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emp-toolbar.component.html',
})
export class EmpToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<EmpFilterType>();
  @Output() tipoFilterChange = new EventEmitter<EmpFilterTipoType>();

  searchValue = '';
  filterValue: EmpFilterType = '';
  tipoFilterValue: EmpFilterTipoType = '';
}