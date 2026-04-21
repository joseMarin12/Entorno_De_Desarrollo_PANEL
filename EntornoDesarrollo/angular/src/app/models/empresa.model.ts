export interface ComercialVinculado {
  id: number;
  nombre: string;
}

export interface Empresa {
  id: number | null;
  nombre: string;
  razonSocial: string;
  tipo?: string;
  cif: string;
  comercial?: string;
  direcciones: number;
  contactos: number;
  activo: boolean;
  id_tipo_empresa: number;
  id_comercial: number | null;
}
