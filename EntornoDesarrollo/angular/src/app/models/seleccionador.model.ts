export type TipoSeleccionador = 'interno' | 'externo';

export interface EmpresaVinculada {
  id: number;
  nombre: string;
}

export interface Seleccionador {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  telefono?: string;
  email?: string;
  tipo: TipoSeleccionador;
  activo: boolean;
  id_empresa?: number;
  empresa?: EmpresaVinculada; 
  fecha_ini?: string;
  salario?: number;
  fee?: number;
  created_at?: string;
  updated_at?: string;
}

export function getFullName(s: Seleccionador): string {
  return [s.nombre, s.primer_apellido, s.segundo_apellido].filter(Boolean).join(' ');
}

export function getInitials(s: Seleccionador): string {
  return ((s.nombre?.[0] ?? '') + (s.primer_apellido?.[0] ?? '')).toUpperCase();
}

export function getColorFor(id: number): string {
  const COLORS = [
    'linear-gradient(135deg,#5a4d9a,#3198bf)',
    'linear-gradient(135deg,#3198bf,#23b4cd)',
    'linear-gradient(135deg,#476fab,#3198bf)',
    'linear-gradient(135deg,#55569e,#476fab)',
    'linear-gradient(135deg,#23b4cd,#3198bf)',
    'linear-gradient(135deg,#5a4d9a,#476fab)',
  ];
  return COLORS[id % COLORS.length];
}
