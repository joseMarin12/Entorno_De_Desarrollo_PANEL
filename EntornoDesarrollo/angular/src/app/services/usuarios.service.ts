import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../models/usuarios.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {

    private nextId = 7;

    private _usuarios = signal<Usuario[]>([
        { id: 1, nombre: 'Carlos', apellido1: 'García', apellido2: 'López', email: 'carlos@example.com', enabled: true },
        { id: 2, nombre: 'María', apellido1: 'Fernández', apellido2: 'Ruiz', email: 'maria@example.com', enabled: true },
        { id: 3, nombre: 'Luis', apellido1: 'Martínez', apellido2: 'Sánchez', email: 'luis@example.com', enabled: false },
        { id: 4, nombre: 'Ana', apellido1: 'Gómez', apellido2: 'Díaz', email: 'ana@example.com', enabled: true },
        { id: 5, nombre: 'Javier', apellido1: 'Pérez', apellido2: 'Moreno', email: 'javier@example.com', enabled: false },
        { id: 6, nombre: 'Laura', apellido1: 'Hernández', apellido2: 'Navarro', email: 'laura@example.com', enabled: true },
    ]);

    readonly usuarios = this._usuarios.asReadonly();

    readonly total = computed(() => this._usuarios().length);
    readonly activos = computed(() => this._usuarios().filter(u => u.enabled).length);
    readonly inactivos = computed(() => this._usuarios().filter(u => !u.enabled).length);

    add(data: Omit<Usuario, 'id'>): void {
        this._usuarios.update(list => [
            ...list,
            { id: this.nextId++, ...data }
        ]);
    }

    update(id: number, data: Omit<Usuario, 'id'>): void {
        this._usuarios.update(list => list.map(u => u.id === id ? { id, ...data } : u));
    }

    toggleActivo(id: number): void {
        this._usuarios.update(list =>
            list.map(u => u.id === id ? { ...u, enabled: !u.enabled } : u)
        );
    }

    getById(id: number): Usuario | undefined {
        return this._usuarios().find(u => u.id === id);
    }

    fullName(u: Usuario): string {
        return [u.nombre, u.apellido1, u.apellido2].filter(Boolean).join(' ');
    }

    initials(u: Usuario): string {
        return ((u.nombre[0] ?? '') + (u.apellido1[0] ?? '')).toUpperCase();
    }

    colorFor(id: number): string {
        const COLORS = [
            'linear-gradient(135deg,#5a4d9a,#476fab)',
            'linear-gradient(135deg,#476fab,#23b4cd)',
            'linear-gradient(135deg,#3198bf,#23b4cd)',
            'linear-gradient(135deg,#55569e,#3198bf)',
            'linear-gradient(135deg,#5a4d9a,#23b4cd)',
        ];
        return COLORS[(id - 1) % COLORS.length];
    }
}
