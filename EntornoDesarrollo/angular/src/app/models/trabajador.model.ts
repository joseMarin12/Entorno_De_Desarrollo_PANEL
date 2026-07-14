export interface Trabajador {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono?: string;
  email?: string;
  dni_nif_pasaporte?: string;
  salario?: number;
  cheques_guarderia?: number;
  cheques_restaurante?: number;
  direccion?: string;
  nacionalidad?: string;
  fecha_nacimiento?: string;
  id_seleccionadores?: number;
  activo: boolean;
  fecha_ini?: string;
  fecha_fin?: string;
  codigo_postal?: string;
  id_localidad?: number;
  freelance: boolean;
  id_provincia?: number;
  id_pais?: number;
  seleccionador_nombre?: string;
  provincia_nombre?: string;
  localidad_nombre?: string;
  pais_nombre?: string;
  asignado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentoParaCrear {
  origen: 'subir';
  tipoId?: string;
  descripcion: string;
  base64: string | null;
  nombre: string;
  requiere_firma: boolean;
}

export interface TrabajadorFormData extends Omit<Trabajador, 'id'> {
  documentos: DocumentoParaCrear[];
}

export function getInitials(t: Trabajador): string {
  return ((t.nombre?.[0] ?? '') + (t.primer_apellido?.[0] ?? '')).toUpperCase();
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
  return COLORS[id % COLORS.length] || COLORS[0];
}
