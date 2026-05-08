export interface DocumentoFirma {
  id?: number;
  nombre_fichero: string;
  estado: 'pendiente_trabajador' | 'pendiente_rrhh' | 'completado' | string;
  fecha_asignacion: string;
  fecha_firma_trabajador?: string;
  fecha_firma_rrhh?: string;
  requiere_firma_rrhh: boolean;
  link_sharepoint?: string;
}
