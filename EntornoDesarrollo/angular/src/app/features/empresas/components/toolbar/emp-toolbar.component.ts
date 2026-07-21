import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, map, throwError } from 'rxjs';
import { TipoEmpresa } from '../../../../models/tipo-empresa.model';
import { Empresa } from '../../../../models/empresa.model';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { CsvImportComponent, CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { environment } from '../../../../../environments/environment';

export type EmpFilterType = '' | 'activa' | 'baja';
export type EmpFilterTipoType = string;

interface ComercialLookup {
  id: number;
  nombre_completo: string;
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, CsvImportComponent],
  templateUrl: './emp-toolbar.component.html',
})
export class EmpToolbarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<EmpFilterType>();
  @Output() tipoFilterChange = new EventEmitter<EmpFilterTipoType>();
  @Output() dataChanged = new EventEmitter<void>();

  private empresasApi = inject(EmpresasApiService);
  private http = inject(HttpClient);
  private _tipos = signal<TipoEmpresa[]>([]);
  readonly tipos = this._tipos.asReadonly();
  private comerciales: ComercialLookup[] = [];

  searchValue = '';
  filterValue: EmpFilterType = '';
  tipoFilterValue: EmpFilterTipoType = '';

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'nombre', label: 'nombre', required: true, hint: 'Nombre comercial de la empresa' },
    { key: 'razonsocial', label: 'razonsocial', required: true, hint: 'Razón social completa' },
    { key: 'cif', label: 'cif', required: true, hint: 'Una letra mayúscula + 8 dígitos, ej. B12345678' },
    { key: 'tipo', label: 'tipo', required: true, hint: 'Tecnológica, Consultoría, Logística o Marketing' },
    { key: 'comercial', label: 'comercial', required: false, hint: 'Nombre completo de un comercial ya existente (opcional)' },
  ];

  csvRowLabel = (row: Record<string, string>): string => row['nombre'] || row['cif'];

  importEmpresaRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    const tipoTexto = (row['tipo'] || '').trim().toLowerCase();
    const tipo = this._tipos().find(t => t.nombre.trim().toLowerCase() === tipoTexto);
    if (!tipo) {
      return throwError(() => new Error(`El tipo "${row['tipo']}" no existe`));
    }

    const cif = (row['cif'] || '').trim().toUpperCase();
    if (!/^[A-Z]\d{8}$/.test(cif)) {
      return throwError(() => new Error('CIF no válido (formato esperado: B12345678)'));
    }

    let id_comerciales: number | null = null;
    const comercialTexto = (row['comercial'] || '').trim().toLowerCase();
    if (comercialTexto) {
      const comercial = this.comerciales.find(c => c.nombre_completo.trim().toLowerCase() === comercialTexto);
      if (!comercial) {
        return throwError(() => new Error(`El comercial "${row['comercial']}" no existe`));
      }
      id_comerciales = comercial.id;
    }

    const data = {
      id: null,
      nombre: row['nombre'].trim(),
      razonSocial: row['razonsocial'].trim(),
      cif,
      id_tipo_empresa: tipo.id,
      id_comerciales,
      activo: true,
      direcciones: 0,
      contactos: 0,
    } as Empresa;

    return this.empresasApi.create(data).pipe(map(() => ({})));
  };

  async ngOnInit(): Promise<void> {
    const tipos = await firstValueFrom(this.empresasApi.findTipos());
    this._tipos.set(tipos);

    const comercialesRes = await firstValueFrom(
      this.http.post<{ data: ComercialLookup[] }>(`${environment.apiUrl}/asignaciones`, { action: 'getComerciales' })
    );
    this.comerciales = comercialesRes.data ?? [];
  }
}
