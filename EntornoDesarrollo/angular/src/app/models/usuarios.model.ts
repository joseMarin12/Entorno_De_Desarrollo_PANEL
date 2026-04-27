export interface Usuario {
  id: number;
  nombre: string;
  apellido1: string;
  email: string;
  enabled: boolean;
  password?: string;
  roleid?: number | string;
}

export interface Role {
  id: number;
  name: string;
}
