export interface Usuario {
  id: number;
  nombre: string;
  apellido1: string;
  email: string;
  enabled: boolean;
  password?: string;
  role_id?: number | string;
}
