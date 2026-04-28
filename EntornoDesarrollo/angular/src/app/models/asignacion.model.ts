export interface Asignacion {
  id: number;
  id_empresa: number;
  id_trabajador: number;
  id_comerciales: number;
  fecha_ini?: string;
  fecha_fin?: string;
  tarifa?: number;
  activo?: boolean;
  // Joins opcionales para la vista
  empresa_nombre?: string;
  trabajador_nombre?: string;
  comercial_nombre?: string;
}
