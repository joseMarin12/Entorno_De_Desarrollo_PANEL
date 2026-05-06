import { ColumnDef } from "../../../../shared/table/table.component";

export const tableColumns: ColumnDef[] = [
    {
        header:'Dirección',
        type: 'icon-with-info',
        activeField: 'activo',
        iconWithInfoConfig: {
            icon: 'location',
            iconColor: '#1976d2',
            mainField: 'direccion',
            mainFieldType: 'text',
        },
    },
    {
        header: 'Código Postal',
        type: 'text',
        field: 'codigoPostal',
        activeField: 'activo'
    },
    {
        header: 'País',
        type: 'text',
        field: 'pais',
        activeField: 'activo'
    },
    {
        header: 'Provincia',
        type: 'text',
        field: 'provincia',
        activeField: 'activo'
    },
    {
        header: 'Localidad',
        type: 'text',
        field: 'localidad',
        activeField: 'activo'
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
            { type: 'edit', title: 'Editar', icon: 'edit', variant: 'edit' },
            { type: 'baja', title: 'Dar de baja', icon: 'alert-circle', variant: 'danger', showWhen: 'active', activeField: 'activo' },
            { type: 'activar', title: 'Activar', icon: 'check-circle', variant: 'success', showWhen: 'inactive', activeField: 'activo' }
        ]
    }
]