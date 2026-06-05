export interface DireccionEmpresa {
    id: number | null;
    direccion: string;
    codigoPostal: string;
    localidad?: string;
    provincia?: string;
    pais?: string;
    activo: boolean;
    id_empresa: number;
    id_localidad: number;
    id_provincia: number;
    id_pais: number;
}