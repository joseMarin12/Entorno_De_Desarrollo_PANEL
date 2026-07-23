export interface ContactoEmpresa {
    id: number;
    id_empresa?: number;
    nombre?: string;
    primer_nombre?: string;
    segundo_nombre?: string;
    apellido?: string;
    primer_apellido?: string;   // 🟢 Agregado para resolver el error del HTML (línea 32)
    segundo_apellido?: string;  // 🟢 Agregado preventivamente
    nombre_completo?: string;
    cargo?: string;
    email?: string;
    telefono?: string;
    estado?: string | boolean;
    created_at?: string;
    updated_at?: string;
}
