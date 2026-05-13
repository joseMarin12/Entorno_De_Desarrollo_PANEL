import { ColumnDef } from '../../../../shared/table/table.component';

export const TRABAJADORES_COLUMNS: ColumnDef[] = [
  {
    header: 'Trabajador',
    type: 'avatar-name',
    nameFields: ['nombre', 'primer_apellido'],
    subField: 'dni_nif_pasaporte',
    activeField: 'activo',
    initialsFn: (row: any) => {
      const n = row.nombre?.[0] || '';
      const a = row.primer_apellido?.[0] || '';
      return (n + a).toUpperCase();
    },
    colorFn: (row: any) => {
      const COLORS = [
        'linear-gradient(135deg,#5a4d9a,#3198bf)',
        'linear-gradient(135deg,#3198bf,#23b4cd)',
        'linear-gradient(135deg,#476fab,#3198bf)',
        'linear-gradient(135deg,#55569e,#476fab)',
      ];
      return COLORS[(row.id || 0) % COLORS.length];
    }
  },
  {
    header: 'Teléfono',
    type: 'text',
    field: 'telefono'
  },
  {
    header: 'Email',
    type: 'text',
    field: 'email'
  },
  {
    header: 'Salario',
    type: 'number',
    field: 'salario',
    locale: 'es-ES',
    numberOptions: { style: 'currency', currency: 'EUR' }
  },
  {
    header: 'Tipo',
    type: 'enum-badge',
    field: 'freelance',
    enumMap: {
      false: { label: 'Plantilla', background: '#eef2ff', color: '#4338ca' }, // false -> Plantilla
      true:  { label: 'Freelance', background: '#e3f2fd', color: '#1565c0' }  // true -> Freelance
    }
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
      { type: 'view', title: 'Ver detalle', icon: 'eye', variant: 'view' },
      { type: 'edit', title: 'Editar', icon: 'edit', variant: 'edit' },
      { 
        type: 'baja', 
        title: 'Dar de baja', 
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
