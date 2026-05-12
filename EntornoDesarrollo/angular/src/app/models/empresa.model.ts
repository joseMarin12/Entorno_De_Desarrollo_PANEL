export interface ComercialVinculado {
  id: number;
  nombre: string;
}

export interface Empresa {
  id: number | null;
  nombre: string;
  razonSocial: string;
  tipo?: string;
  cif: string;
  comercial?: string;
  direcciones: number;
  contactos: number;
  activo: boolean;
  id_tipo_empresa: number;
  id_comerciales: number | null;
}

export function getInitials(e: Empresa): string {
    return (e.nombre[0] + e.nombre[1]).toUpperCase();
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