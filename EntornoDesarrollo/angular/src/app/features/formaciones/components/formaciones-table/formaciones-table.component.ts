import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent, ColumnDef } from '../../../../shared/table/table.component';
import { Formacion } from '../../../../models/formacion.model';
import { FormacionesService } from '../../../../services/formaciones.service';

@Component({
  selector: 'app-formaciones-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <app-table
      [columns]="columns"
      [rows]="formaciones"
      [currentPage]="currentPage"
      [pageSize]="pageSize"
      [totalFiltered]="totalFiltered"
      entityLabel="formaciones"
      (pageChange)="pageChange.emit($event)"
      (actionClick)="onAction($event)"
      (rowDblClick)="detailClick.emit($event)">
    </app-table>
  `,
})
export class FormacionesTableComponent {
  @Input() formaciones: Formacion[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() editClick = new EventEmitter<number>();
  @Output() bajaClick = new EventEmitter<number>();
  @Output() participantesClick = new EventEmitter<number>();
  @Output() detailClick = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(FormacionesService);

  columns: ColumnDef[] = [
    {
      header: 'Formacion',
      type: 'avatar-name',
      nameFields: ['curso'],
      activeField: 'activo', // Hemos quitado subField y subPrefix para ocultar el ID
      colorFn: (id) => this.svc.colorFor(id),
      initialsFn: (row) => this.svc.initials(row),
    },
    {
      header: 'Denominacion',
      type: 'text',
      field: 'denominacion',
    },
    {
      header: 'Horario',
      type: 'text',
      field: 'horario',
    },
    {
      header: 'Estado',
      type: 'status-badge',
      activeField: 'activo',
      activeLabel: 'Activo',
      inactiveLabel: 'Inactivo',
    },
    {
      header: 'Acciones',
      type: 'actions',
      actions: [
        {
          type: 'edit',
          title: 'Editar',
          icon: 'edit',
          variant: 'edit',
          showWhen: 'always',
        },
        {
          type: 'baja',
          title: 'Dar de baja',
          icon: 'alert-circle',
          variant: 'danger',
          showWhen: 'active',
          activeField: 'activo',
        },
        {
          type: 'baja',
          title: 'Reactivar',
          icon: 'check-circle',
          variant: 'success',
          showWhen: 'inactive',
          activeField: 'activo',
        },
        {
          type: 'participantes',
          title: 'Ver participantes',
          icon: 'eye',
          variant: 'view',
          showWhen: 'always',
        },
      ],
    },
  ];

  onAction(event: { type: string; id: number }): void {
    if (event.type === 'edit') this.editClick.emit(event.id);
    if (event.type === 'baja') this.bajaClick.emit(event.id);
    if (event.type === 'participantes') this.participantesClick.emit(event.id);
  }
}