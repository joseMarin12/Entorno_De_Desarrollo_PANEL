export interface Comercial {
  id: number | null;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  telefono: string;
  email: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export function comercialFullName(c: Comercial): string {
  return [c.nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean).join(' ');
}