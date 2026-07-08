import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asignacion } from '../../../../models/asignacion.model';
import { AsignacionesService } from '../../../../services/asignaciones.service';
import { TableComponent, ColumnDef } from '../../../../shared/table/table.component';

@Component({
  selector: 'app-asignaciones-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  template: `
    <app-table
      [columns]="columns"
      [rows]="asignaciones"
      [currentPage]="currentPage"
      [pageSize]="pageSize"
      [totalFiltered]="totalFiltered"
      entityLabel="asignaciones"
      (pageChange)="pageChange.emit($event)"
      (actionClick)="onAction($event)">
    </app-table>
  `,
})
export class AsignacionesTableComponent {
  @Input() asignaciones: Asignacion[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() editClick = new EventEmitter<number>();
  @Output() bajaClick = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(AsignacionesService);

  columns: ColumnDef[] = [
    {
      header: 'Empresa',
      type: 'avatar-name',
      nameFields: ['nombre_empresa'],
      activeField: 'activo', // Eliminados subField e id para limpiar el diseño
      colorFn: (id) => this.svc.colorFor(id),
      initialsFn: (row) => this.svc.initials(row),
    },
    {
      header: 'Trabajador',
      type: 'text',
      field: 'trabajador_nombre',
    },
    {
      header: 'Comercial',
      type: 'text',
      field: 'comercial_nombre',
    },
    {
      header: 'Fecha Ini',
      type: 'date',
      field: 'fecha_ini',
      locale: 'es-ES',
      dateOptions: { day: '2-digit', month: '2-digit', year: 'numeric' },
    },
    {
      header: 'Fecha Fin',
      type: 'date',
      field: 'fecha_fin',
      locale: 'es-ES',
      dateOptions: { day: '2-digit', month: '2-digit', year: 'numeric' },
    },
    {
      header: 'Tarifa',
      type: 'number',
      field: 'tarifa',
      locale: 'es-ES',
      numberOptions: { style: 'currency', currency: 'EUR' },
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
      ],
    },
  ];

  onAction(event: { type: string; id: number }): void {
    if (event.type === 'edit') this.editClick.emit(event.id);
    if (event.type === 'baja') this.bajaClick.emit(event.id);
  }
}