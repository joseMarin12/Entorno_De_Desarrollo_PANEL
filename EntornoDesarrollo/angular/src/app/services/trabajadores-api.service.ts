import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Trabajador } from '../models/trabajador.model';
import { BaseCrud } from './base.service';
import { environment } from '../../environments/environment';

export interface TrabajadorStats {
  total: number;
  activos: number;
  inactivos: number;
  freelances: number;
}

export interface TrabajadorPage {
  data: Trabajador[];
  totalFiltered: number;
  stats: TrabajadorStats;
}

// ==========================================
// MOCK DATA PARA DESARROLLO DE UI
// ==========================================
const MOCK_TRABAJADORES: Trabajador[] = [
  {
    id: 1,
    nombre: 'Carlos',
    primer_apellido: 'Ruiz',
    segundo_apellido: 'Blanco',
    dni_nif_pasaporte: '12345678A',
    email: 'carlos.ruiz@email.com',
    telefono: '+34 611 111 111',
    salario: 2800,
    cheques_restaurante: 150,
    nacionalidad: 'Española',
    fecha_nacimiento: '1990-05-15',
    activo: true,
    freelance: false,
    direccion: 'Calle Mayor 10',
    codigo_postal: '28001',
    provincia_nombre: 'Madrid',
    localidad_nombre: 'Madrid',
    seleccionador_nombre: 'Javier Morales',
    fecha_ini: '2022-01-10',
  },
  {
    id: 2,
    nombre: 'Laura',
    primer_apellido: 'Gómez',
    dni_nif_pasaporte: '87654321B',
    email: 'laura.gomez@email.com',
    telefono: '+34 622 222 222',
    salario: 0,
    activo: true,
    freelance: true, // Freelance
    provincia_nombre: 'Barcelona',
    localidad_nombre: "L'Hospitalet", 
    fecha_ini: '2023-03-01',
  }
 
];

const MOCK_STATS: TrabajadorStats = {
  total: 2,
  activos: 1,
  inactivos: 1,
  freelances: 1
};

@Injectable({ providedIn: 'root' })
export class TrabajadoresApiService extends BaseCrud<Trabajador> {
  protected readonly API_URL = `${environment.apiUrl}/trabajadores`;

  // Mantenemos en memoria temporalmente para que se vea el efecto de crear/editar/eliminar
  private localData = [...MOCK_TRABAJADORES];
  private currentId = 4;

  findAll(page = 1, limit = 10, searchText = '', status = '', tipo = ''): Observable<TrabajadorPage> {
    console.log('[Mock API] findAll', { page, limit, searchText, status, tipo });
    
    // Simular filtrado
    let filtered = [...this.localData];
    
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(t => 
        t.nombre.toLowerCase().includes(lower) || 
        t.primer_apellido.toLowerCase().includes(lower) ||
        t.email?.toLowerCase().includes(lower) ||
        t.dni_nif_pasaporte?.toLowerCase().includes(lower)
      );
    }

    if (status === 'activo') filtered = filtered.filter(t => t.activo === true);
    if (status === 'inactivo') filtered = filtered.filter(t => t.activo === false);
    
    if (tipo === 'plantilla') filtered = filtered.filter(t => t.freelance === false);
    if (tipo === 'freelance') filtered = filtered.filter(t => t.freelance === true);

    // Calcular stats de lo que quedó activo/inactivo/freelance del total de localData
    const stats: TrabajadorStats = {
      total: this.localData.length,
      activos: this.localData.filter(t => t.activo).length,
      inactivos: this.localData.filter(t => !t.activo).length,
      freelances: this.localData.filter(t => t.freelance).length,
    };

    // Paginación
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return of({
      data: paginated,
      totalFiltered: filtered.length,
      stats
    }).pipe(delay(600)); // Simular latencia de red
  }

  create(data: Omit<Trabajador, 'id'>): Observable<Trabajador> {
    console.log('[Mock API] create', data);
    const newWorker = { ...data, id: this.currentId++ } as Trabajador;
    this.localData.unshift(newWorker);
    return of(newWorker).pipe(delay(500));
  }

  update(id: number, data: Partial<Trabajador>): Observable<Trabajador> {
    console.log('[Mock API] update', id, data);
    const index = this.localData.findIndex(t => t.id === id);
    if (index > -1) {
      this.localData[index] = { ...this.localData[index], ...data };
      return of(this.localData[index]).pipe(delay(500));
    }
    return throwError(() => new Error('Trabajador no encontrado'));
  }

  toggleStatus(id: number): Observable<Trabajador> {
    console.log('[Mock API] toggleStatus', id);
    const index = this.localData.findIndex(t => t.id === id);
    if (index > -1) {
      this.localData[index].activo = !this.localData[index].activo;
      return of(this.localData[index]).pipe(delay(500));
    }
    return throwError(() => new Error('Trabajador no encontrado'));
  }
}
