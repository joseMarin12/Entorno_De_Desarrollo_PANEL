export interface Trabajador {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido?: string | null;
  dni_nif_pasaporte?: string;
  email?: string;
  telefono?: string;
  activo?: number | boolean;
  asignado?: boolean; // Flag de si está en la formación cargada.
}
