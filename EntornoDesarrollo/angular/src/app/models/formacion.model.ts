export interface Formacion {
  id: number;
  id_estado?: number;
  curso: string;
  denominacion: string;
  motivo?: string;
  id_area?: number;
  recursos?: string;
  id_responsable?: number;
  id_modalidad?: number;
  duracion?: number;
  dentro_fuera_jornada?: string;
  observaciones?: string;
  fecha_prevista?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horario?: string;
  id_ejecucion?: number;
  eficacia?: string;
  anio?: number;
  coste?: number;
  bonificacion?: number;
  total?: number;
}
