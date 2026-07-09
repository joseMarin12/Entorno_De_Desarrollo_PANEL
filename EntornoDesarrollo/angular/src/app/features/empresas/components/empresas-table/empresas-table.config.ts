import { ColumnDef } from '../../../../shared/table/table.component';

export const EMPRESAS_COLUMNS: ColumnDef[] = [
  {
    header: 'Empresa',
    type: 'avatar-name',
    nameFields: ['nombre', 'razonSocial'],
    activeField: 'activo', // ID fulminado definitivamente
    colorFn: (id: number) => {
      const COLORS = [
        'linear-gradient(135deg,#5a4d9a,#476fab)',
        'linear-gradient(135deg,#476fab,#23b4cd)',
        'linear-gradient(135deg,#3198bf,#23b4cd)',
        'linear-gradient(135deg,#55569e,#3198bf)',
        'linear-gradient(135deg,#5a4d9a,#23b4cd)',
      ];
      return COLORS[(id - 1) % COLORS.length];
    },
    initialsFn: (row: any) => {
      if (!row.nombre) return 'EM';
      return (row.nombre[0] + (row.nombre[1] || '')).toUpperCase();
    }
  },
  {
    header: 'Tipo',
    type: 'text',
    field: 'tipo'
  },
  {
    header: 'CIF',
    type: 'text',
    field: 'cif'
  },
  {
    header: 'Direcciones',
    type: 'icon-with-info',
    iconWithInfoConfig: {
      icon: 'location',
      mainField: 'direcciones'
    }
  },
  {
    header: 'Contacto',
    type: 'icon-with-info',
    iconWithInfoConfig: {
      icon: 'phone',
      mainField: 'contactos'
    }
  },
  {
    header: 'Comercial',
    type: 'text',
    field: 'comercial'
  },
  {
    header: 'Estado',
    type: 'status-badge',
    activeField: 'activo',
    activeLabel: 'Activa',
    inactiveLabel: 'Inactiva'
  },
  {
    header: 'Acciones',
    type: 'actions',
    actions: [
      {
        type: 'edit',
        title: 'Editar',
        icon: 'edit',
        variant: 'view'
      },
      {
        type: 'baja',
        title: 'Dar de Baja',
        icon: 'ban',
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