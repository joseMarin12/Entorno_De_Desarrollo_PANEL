export interface ContactoEmpresa {
    id: number;
    id_empresa?: number;
    nombre?: string;
    apellido?: string;
    nombre_completo?: string;
    cargo?: string;
    email?: string;
    telefono?: string;
    estado?: string | boolean;
    created_at?: string;
    updated_at?: string;
}
