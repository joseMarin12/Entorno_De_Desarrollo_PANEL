import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CsvImportComponent, CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { UsuariosService } from '../../../../services/usuarios.service';
import { Usuario } from '../../../../models/usuarios.model';

export type UsuariosFilterType = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-usuarios-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, CsvImportComponent],
  template: `
    <div class="toolbar">
      <div class="search-wrap">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Buscar por nombre, email…"
          name="campo_busqueda_usuarios_sin_autorrelleno"
          autocomplete="new-password"
          [(ngModel)]="searchValue"
          (ngModelChange)="searchChange.emit($event)"
        />
      </div>

      <div class="view-tabs">
        <button class="view-tab" [class.active]="activeFilter() === 'todos'" (click)="setFilter('todos')">Todos</button>
        <button class="view-tab" [class.active]="activeFilter() === 'activos'" (click)="setFilter('activos')">Activos</button>
        <button class="view-tab" [class.active]="activeFilter() === 'inactivos'" (click)="setFilter('inactivos')">Inactivos</button>
      </div>

      <app-csv-import
        [columns]="csvColumns"
        [importRow]="importUsuarioRow"
        [rowLabel]="csvRowLabel"
        (imported)="dataChanged.emit()"
      />
    </div>
  `,
})
export class UsuariosToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<UsuariosFilterType>();
  @Output() dataChanged = new EventEmitter<void>();

  private usuariosSvc = inject(UsuariosService);

  searchValue = '';
  activeFilter = signal<UsuariosFilterType>('todos');

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'nombre', label: 'nombre', required: true, hint: 'Nombre de pila del usuario' },
    { key: 'apellido', label: 'apellido', required: true, hint: 'Primer apellido' },
    { key: 'email', label: 'email', required: true, hint: 'No puede repetirse un email ya registrado' },
    { key: 'rol', label: 'rol', required: true, hint: 'Administrador o Usuario' },
    { key: 'password', label: 'password', required: false, hint: 'Si se deja vacío, se genera una contraseña temporal automáticamente' },
  ];

  csvRowLabel = (row: Record<string, string>): string =>
    [row['nombre'], row['apellido']].filter(Boolean).join(' ') || row['email'];

  private emailsEnEsteLote = new Set<string>();

  importUsuarioRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    const rolTexto = (row['rol'] || '').trim().toLowerCase();
    const rol = this.usuariosSvc.roles().find(r => r.name.trim().toLowerCase() === rolTexto);
    if (!rol) {
      return throwError(() => new Error(`El rol "${row['rol']}" no existe`));
    }

    const emailLower = (row['email'] || '').trim().toLowerCase();
    if (this.emailsEnEsteLote.has(emailLower)
      || this.usuariosSvc.usuarios().some(u => (u.email || '').toLowerCase() === emailLower)) {
      return throwError(() => new Error('El email ya está registrado'));
    }

    const providedPassword = (row['password'] || '').trim();
    const password = providedPassword || this.generateTempPassword();

    const data: Omit<Usuario, 'id'> = {
      nombre: row['nombre'].trim(),
      apellido1: row['apellido'].trim(),
      email: row['email'].trim(),
      enabled: true,
      roleid: rol.id,
      password,
    };

    return this.usuariosSvc.add(data).pipe(
      map(() => {
        this.emailsEnEsteLote.add(emailLower);
        return providedPassword ? {} : { note: `Contraseña temporal asignada: ${password}` };
      }),
      catchError(err => {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('cannot read propert') || msg.includes('duplicate') || msg.includes('unique')) {
          return throwError(() => new Error('El email ya está registrado'));
        }
        return throwError(() => err);
      })
    );
  };

  private generateTempPassword(): string {
    const random = Math.random().toString(36).slice(-8);
    return `Sg${random}1!`;
  }

  setFilter(filter: UsuariosFilterType): void {
    this.activeFilter.set(filter);
    this.filterChange.emit(filter);
  }
}
