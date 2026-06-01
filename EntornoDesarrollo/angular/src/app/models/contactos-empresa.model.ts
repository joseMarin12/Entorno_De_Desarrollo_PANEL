export interface ContactosEmpresa {
    id: number | null;
    nombre: string;
    primer_apellido: string;
    telefono: string;
    email: string;
    cargo: string;
    id_empresa: number;
    activo: boolean;
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