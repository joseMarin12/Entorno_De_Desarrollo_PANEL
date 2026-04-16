export type TipoSeleccionador = 'interno' | 'externo';

export interface EmpresaVinculada {
  id: number;
  nombre: string;
}

export interface Seleccionador {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  telefono?: string;
  email?: string;
  tipo: TipoSeleccionador;
  activo: boolean;
  
  // Campos exclusivos de seleccionador externo:
  id_empresa?: number;
  empresa?: EmpresaVinculada; // Objeto completo devuelto por Laravel
  fecha_ini?: string;
  salario?: number;
  fee?: number;

  // Auditoría (vienen del backend)
  created_at?: string;
  updated_at?: string;
}
