import { ColumnDef } from '../../../../shared/table/table.component';
import { getColorFor, getInitials } from '../../../../models/seleccionador.model';

export const tableColumns: ColumnDef[] = [
  {
    header: 'Nombre',
    type: 'avatar-name',
    nameFields: ['nombre', 'primer_apellido', 'segundo_apellido'],
    activeField: 'activo',
    colorFn: (id) => getColorFor(id),
    initialsFn: (row) => getInitials(row)
  },
  {
    header: 'Tipo',
    type: 'enum-badge',
    field: 'tipo',
    enumMap: {
      interno: { label: 'Interno', background: '#e8eaf6', color: '#3949ab' },
      externo: { label: 'Externo', background: '#fff3e0', color: '#e65100' }
    }
  },
  {
    header: 'Empresas vinculadas',
    type: 'relation-chip',
    skipField: 'tipo',
    skipValue: 'interno',
    relationField: 'empresa',
    relationNameField: 'nombre',
    emptyLabel: 'Sin empresa'
  },
  {
    header: 'Estado',
    type: 'status-badge',
    activeField: 'activo',
    inactiveLabel: 'De baja'
  },
  {
    header: 'Acciones',
    type: 'actions',
    actions: [
      { type: 'detail', title: 'Ver detalle', icon: 'eye', variant: 'view' },
      { type: 'edit', title: 'Editar', icon: 'edit', variant: 'edit' },
      {
        type: 'baja',
        title: 'Dar de Baja',
        icon: 'alert-circle',
        variant: 'danger',
        showWhen: 'active',
        activeField: 'activo'
      },
      {
        type: 'activar',
        title: 'Activar',
        icon: 'check-circle',
        variant: 'success',
        showWhen: 'inactive',
        activeField: 'activo'
      }
    ]
  }
];
