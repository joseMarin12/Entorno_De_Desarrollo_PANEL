import { ContactosEmpresa, getColorFor } from "../../../models/contactos-empresa.model";
import { ColumnDef } from "../../../shared/table/table.component";

export const tableColumns: ColumnDef[] = [
    {
        header: 'Nombre',
        type: 'avatar-name',
        nameFields: ['nombre', 'primer_apellido'],
        activeField: 'activo',
        colorFn: (id: number) => getColorFor(id),
        initialsFn: (row: ContactosEmpresa) =>
            ((row.nombre?.[0] ?? '') + (row.primer_apellido?.[0] ?? '')).toUpperCase(),
    },
    { header: 'Teléfono', type: 'text', field: 'telefono', activeField: 'activo' },
    { header: 'Email', type: 'text', field: 'email', activeField: 'activo' },
    { header: 'Cargo', type: 'relation-chip', relationField: 'cargo', activeField: 'activo' },
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
]