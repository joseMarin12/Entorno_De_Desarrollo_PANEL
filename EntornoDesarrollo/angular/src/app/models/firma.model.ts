
export type EstadoFirma =
  | 'PENDIENTE_ENVIO'
  | 'EN_SINATURA'
  | 'COMPLETADO'
  | 'RECHAZADO'
  | 'CANCELADO';

export const MOTIVO_CANCELACION_RRHH = 'Cancelado por RRHH';
export interface TipoDocLookup {
  id: number;
  tipo: string;
}


export interface PosicionFirma {
  rol: 'trabajador' | 'rrhh';
  page: number;
  xo: number;
  yo: number;
  width: number;
  height: number;
}


export interface FirmaInfo {
  id: number;
  estado: EstadoFirma;
  fecha_asignacion: string | null;
  sinatura_id: string | null;
  requiere_firma_rrhh: boolean;
  email_segundo_firmante: string | null;
  motivo?: string | null;
  fecha_envio?: string | null;
  fecha_firma_trabajador?: string | null;
  fecha_firma_rrhh?: string | null;
  fecha_completado?: string | null;
}

export interface DocFile {
  id: number;
  nombre_fichero: string;
  tipo_nombre: string;
  tipo_id: number | null;
  descripcion: string | null;
  fecha_creacion: string;
  firma: FirmaInfo | null;
}

export interface DocumentoSubida {
  origen: 'subir';
  tipoId: string;
  descripcion: string;
  requiere_firma: boolean;
  fileName: string;
  base64: string;
}

export interface FirmaModalData {
  id?: number;
  doc_id?: number;
  nombre_fichero?: string | null;
  id_tipo_documento?: number | null;
  tipo_nombre?: string | null;
  estado: EstadoFirma;
  fecha_asignacion?: string | null;
  sinatura_id?: string | null;
  requiere_firma_rrhh?: boolean;
  email_segundo_firmante?: string | null;
  motivo?: string | null;
  fecha_envio?: string | null;
  fecha_firma_trabajador?: string | null;
  fecha_firma_rrhh?: string | null;
  fecha_completado?: string | null;
}

export function estadoFirmaLabel(estado: EstadoFirma): string {
  switch (estado) {
    case 'PENDIENTE_ENVIO': return 'Pendiente de firma';
    case 'EN_SINATURA':     return 'Firmando';
    case 'COMPLETADO':      return 'Firmado';
    case 'RECHAZADO':       return 'Rechazado';
    case 'CANCELADO':       return 'Cancelada';
  }
}

export function estadoFirmaCssClass(estado: EstadoFirma): string {
  switch (estado) {
    case 'PENDIENTE_ENVIO': return 'pendiente';
    case 'EN_SINATURA':     return 'proceso';
    case 'COMPLETADO':      return 'completado';
    case 'RECHAZADO':       return 'rechazado';
    case 'CANCELADO':       return 'cancelado';
  }
}
