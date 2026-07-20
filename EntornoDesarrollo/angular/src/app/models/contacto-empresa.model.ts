export interface ContactoEmpresa {
  id: number | null;
  nombre: string;
  primer_apellido: string;
  cargo: string;
  email: string;
  telefono: string;
  id_empresa: number;
  activo: boolean;
  created_at?: string;
}
