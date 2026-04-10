export type TipoSeleccionador = 'interno' | 'externo';

export interface EmpresaVinculada {
  id: number;
  nombre: string;
}

export interface Seleccionador {
  id: number;
  nombre: string;
  ap1: string;
  ap2: string;
  telefono?: string;
  email?: string;
  tipo: TipoSeleccionador;
  activo: boolean;
  // Campos exclusivos de seleccionador externo:
  empresaVinculada?: EmpresaVinculada; // Ahora es una sola empresa
  fechaInicio?: string;
  salario?: number;
  fee?: number;
}
