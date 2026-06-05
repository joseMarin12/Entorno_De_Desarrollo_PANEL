import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../../models/usuarios.model';
import { UsuariosService } from '../../../../services/usuarios.service';
import { TableComponent, ColumnDef } from '../../../../shared/table/table.component';

@Component({
  selector: 'app-usuarios-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './usuarios-table.component.html',
  styles: []
})
export class UsuariosTableComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalFiltered = 0;

  @Output() detailClick = new EventEmitter<number>();
  @Output() editClick = new EventEmitter<number>();
  @Output() bajaClick = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  svc = inject(UsuariosService);

  columns: ColumnDef[] = [
    {
      header: 'Nombre',
      type: 'avatar-name',
      nameFields: ['nombre'],
      activeField: 'enabled',
      initialsFn: (row: Usuario) => this.svc.initials(row),
      colorFn: (id: number) => this.svc.colorFor(id)
    },
    {
      header: 'Primer Apellido',
      type: 'text',
      field: 'apellido1'
    },
    {
      header: 'Email',
      type: 'text',
      field: 'email'
    },
    {
      header: 'Estado',
      type: 'status-badge',
      activeField: 'enabled'
    },
    {
      header: 'Acciones',
      type: 'actions',
      actions: [
        { type: 'detail', title: 'Ver detalle', icon: 'eye', variant: 'view' },
        { type: 'edit', title: 'Editar', icon: 'edit', variant: 'edit' },
        { type: 'baja', title: 'Dar de Baja', icon: 'ban', variant: 'danger', showWhen: 'active', activeField: 'enabled' },
        { type: 'baja', title: 'Activar', icon: 'check-circle', variant: 'success', showWhen: 'inactive', activeField: 'enabled' }
      ]
    }
  ];

  onAction(event: { type: string; id: number }): void {
    if (event.type === 'detail') this.detailClick.emit(event.id);
    else if (event.type === 'edit') this.editClick.emit(event.id);
    else if (event.type === 'baja') this.bajaClick.emit(event.id);
  }
}
