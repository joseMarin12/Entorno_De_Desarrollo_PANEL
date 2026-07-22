export interface Formacion {
  // ── Campos base de la tabla ─────────────────────
  id: number;
  curso: string;
  id_estado?: number;
  denominacion?: string;
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
  activo?: boolean;
  created_at?: string;
  updated_at?: string;

  // ── Etiquetas resueltas por el backend (solo lectura, para tablas/detalle) ──
  estado_nombre?: string;
  area_nombre?: string;
  modalidad_nombre?: string;
  ejecucion_nombre?: string;
}
