export interface Formacion {
  // ── Campos base de la tabla ─────────────────────
  id: number;
  curso: string;
  id_estado?: number;
  denominacion?: string;
  motivo?: string;
  id_area?: number;
  area_nombre?: string;
  recursos?: string;
  id_responsable?: number;
  responsable_nombre?: string;
  id_modalidad?: number;
  modalidad_nombre?: string;
  duracion?: number;
  dentro_fuera_jornada?: string;
  observaciones?: string;
  fecha_prevista?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  horario?: string;
  id_ejecucion?: number;
  ejecucion_nombre?: string;
  eficacia?: string;
  anio?: number;
  coste?: number;
  bonificacion?: number;
  total?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}
