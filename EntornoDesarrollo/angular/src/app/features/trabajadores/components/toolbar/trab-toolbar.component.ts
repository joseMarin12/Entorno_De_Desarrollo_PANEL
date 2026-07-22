import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom, from } from 'rxjs';
import { CsvImportComponent, CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { TrabajadoresApiService } from '../../../../services/trabajadores-api.service';
import { TrabajadorFormData } from '../../../../models/trabajador.model';

export type TrabFilterType     = '' | 'activo' | 'inactivo';
export type TrabFilterTipoType = '' | 'plantilla' | 'freelance';

@Component({
  selector: 'app-trab-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, CsvImportComponent],
  template: `
    <div class="toolbar trab-toolbar" style="display: flex; gap: 1rem; align-items: center; width: 100%;">
      <div class="search-wrap" style="max-width: 420px; flex: 1;">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="search-input" type="text" placeholder="Buscar por nombre, apellido o email…" [(ngModel)]="searchValue" (ngModelChange)="searchChange.emit($event)" />
      </div>
      <select class="form-select custom-select" [(ngModel)]="filterValue" (ngModelChange)="filterChange.emit($event)">
        <option value="">Todos los estados</option><option value="activo">Activos</option><option value="inactivo">De baja</option>
      </select>
      <select class="form-select custom-select" [(ngModel)]="tipoValue" (ngModelChange)="tipoFilterChange.emit($event)">
        <option value="">Todos los tipos</option><option value="plantilla">Plantilla</option><option value="freelance">Freelance</option>
      </select>

      <app-csv-import
        [columns]="csvColumns"
        [importRow]="importTrabajadorRow"
        [rowLabel]="csvRowLabel"
        (imported)="dataChanged.emit()"
      />

    </div>
  `,
  styles: [`
    .trab-toolbar { flex-wrap: wrap; }
    .custom-select { width: 200px; height: 38px; cursor: pointer; }
    @media (max-width: 768px) { .custom-select { width: 100%; } .search-wrap { max-width: 100% !important; } }
  `]
})
export class TrabToolbarComponent {
  @Output() searchChange     = new EventEmitter<string>();
  @Output() filterChange     = new EventEmitter<TrabFilterType>();
  @Output() tipoFilterChange = new EventEmitter<TrabFilterTipoType>();
  @Output() dataChanged      = new EventEmitter<void>();

  private api = inject(TrabajadoresApiService);
  private seleccionadores: { id: number; nombre: string }[] = [];
  private emailsEnEsteLote = new Set<string>();
  private dnisEnEsteLote = new Set<string>();

  searchValue = '';
  filterValue: TrabFilterType     = '';
  tipoValue:   TrabFilterTipoType = '';

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'nombre', label: 'nombre', required: true, hint: 'Nombre de pila' },
    { key: 'primer_apellido', label: 'primer_apellido', required: true, hint: 'Primer apellido' },
    { key: 'dni_nif_pasaporte', label: 'dni_nif_pasaporte', required: true, hint: 'No puede repetirse uno ya registrado' },
    { key: 'email', label: 'email', required: true, hint: 'No puede repetirse uno ya registrado' },
    { key: 'telefono', label: 'telefono', required: true, hint: 'Solo números, espacios y el símbolo +' },
    { key: 'pais', label: 'pais', required: false, hint: 'Se crea automáticamente si no existe (opcional)' },
    { key: 'provincia', label: 'provincia', required: false, hint: 'Requiere indicar también el país (opcional)' },
    { key: 'localidad', label: 'localidad', required: false, hint: 'Requiere indicar también la provincia (opcional)' },
    { key: 'seleccionador', label: 'seleccionador', required: false, hint: 'Nombre y primer apellido de un seleccionador ya existente (opcional)' },
    { key: 'freelance', label: 'freelance (si/no)', required: false, hint: '"si" o "no"; por defecto no (opcional)' },
    { key: 'salario', label: 'salario', required: false, hint: 'Número, sin símbolo de moneda (opcional)' },
  ];

  csvRowLabel = (row: Record<string, string>): string =>
    `${row['nombre']} ${row['primer_apellido']}`;

  async ngOnInit(): Promise<void> {
    this.seleccionadores = await firstValueFrom(this.api.getSeleccionadoresLookup());
  }

  importTrabajadorRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    return from(this.importTrabajadorRowAsync(row));
  };

  private async importTrabajadorRowAsync(row: Record<string, string>): Promise<CsvImportRowOutcome> {
    const email = row['email'].trim();
    const emailLower = email.toLowerCase();
    const dni = row['dni_nif_pasaporte'].trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Formato de correo inválido');
    }
    if (!/^[0-9+\s-]{6,15}$/.test(row['telefono'].trim())) {
      throw new Error('Formato de teléfono inválido');
    }
    if (this.emailsEnEsteLote.has(emailLower)) {
      throw new Error('Este correo ya está registrado');
    }
    if (this.dnisEnEsteLote.has(dni)) {
      throw new Error('Este DNI/NIF ya está registrado');
    }

    if (row['provincia'] && !row['pais']) {
      throw new Error('Si indicas provincia, debes indicar también el país');
    }
    if (row['localidad'] && !row['provincia']) {
      throw new Error('Si indicas localidad, debes indicar también la provincia');
    }

    let id_pais: number | undefined;
    let id_provincia: number | undefined;
    let id_localidad: number | undefined;

    if (row['pais']) {
      id_pais = await firstValueFrom(this.api.resolverPais(row['pais'].trim()));
    }
    if (row['provincia']) {
      id_provincia = await firstValueFrom(this.api.resolverProvincia(row['provincia'].trim(), id_pais!));
    }
    if (row['localidad']) {
      id_localidad = await firstValueFrom(this.api.resolverLocalidad(row['localidad'].trim(), id_provincia!));
    }

    let id_seleccionadores: number | undefined;
    if (row['seleccionador']) {
      const texto = row['seleccionador'].trim().toLowerCase();
      const sel = this.seleccionadores.find(s => s.nombre.trim().toLowerCase() === texto);
      if (!sel) throw new Error(`El seleccionador "${row['seleccionador']}" no existe`);
      id_seleccionadores = sel.id;
    }

    let salario: number | undefined;
    if (row['salario']) {
      salario = Number(row['salario'].replace(',', '.'));
      if (!Number.isFinite(salario) || salario < 0) {
        throw new Error('El salario debe ser un número válido');
      }
    }

    const freelanceTexto = (row['freelance'] || '').trim().toLowerCase();
    const freelance = ['si', 'sí', 'true', '1'].includes(freelanceTexto);

    const data: TrabajadorFormData = {
      nombre: row['nombre'].trim(),
      primer_apellido: row['primer_apellido'].trim(),
      email,
      telefono: row['telefono'].trim(),
      dni_nif_pasaporte: dni,
      id_pais,
      id_provincia,
      id_localidad,
      id_seleccionadores,
      salario,
      freelance,
      activo: true,
      documentos: [],
    };

    try {
      await firstValueFrom(this.api.create(data));
    } catch (err: any) {
      const msg = (err?.error?.message || err?.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        throw new Error('El email o el DNI/NIF ya están registrados');
      }
      throw new Error(err?.error?.message || err?.message || 'No se pudo crear el trabajador');
    }

    this.emailsEnEsteLote.add(emailLower);
    this.dnisEnEsteLote.add(dni);
    return {};
  }
}
