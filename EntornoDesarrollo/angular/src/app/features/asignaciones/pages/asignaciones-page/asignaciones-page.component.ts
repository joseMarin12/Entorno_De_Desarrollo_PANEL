import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';

import { AsignacionesService } from '../../../../services/asignaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Asignacion } from '../../../../models/asignacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { SharedFilterComponent } from '../../../../shared/shared-filter/shared-filter.component';
import { CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { AsignacionesTableComponent } from '../../components/asignaciones-table/asignaciones-table.component';
import { ModalAsignacionComponent } from '../../components/modal-asignacion/modal-asignacion.component';
import { AsignacionesModalDetailComponent } from '../../components/modal-detail/asignaciones-modal-detail.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asignaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TopbarComponent,
    StatsRowComponent,
    SharedFilterComponent,
    AsignacionesTableComponent,
    ModalAsignacionComponent,
    AsignacionesModalDetailComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './asignaciones-page.component.html',
})
export class AsignacionesPageComponent implements OnInit {
  svc = inject(AsignacionesService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  searchField = '';
  activeFilter: string = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showForm = false;
  showBaja = false;
  showDetail = false;
  selectedId: number | null = null;

  // ── Carga masiva CSV ──────────────────────────────
  private empresasLookup: { id: number; nombre_empresa: string }[] = [];
  private trabajadoresLookup: { id: number; nombre_completo: string }[] = [];
  private comercialesLookup: { id: number; nombre_completo: string }[] = [];

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'empresa', label: 'empresa', required: true },
    { key: 'trabajador', label: 'trabajador', required: true },
    { key: 'comercial', label: 'comercial', required: true },
    { key: 'fecha_ini', label: 'fecha_ini (AAAA-MM-DD)', required: true },
    { key: 'tarifa', label: 'tarifa', required: true },
    { key: 'fecha_fin', label: 'fecha_fin (AAAA-MM-DD)', required: false },
  ];

  csvRowLabel = (row: Record<string, string>): string =>
    `${row['empresa']} / ${row['trabajador']}`;

  csvImportRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    const empresaTexto = row['empresa'].trim().toLowerCase();
    const empresa = this.empresasLookup.find(e => e.nombre_empresa.trim().toLowerCase() === empresaTexto);
    if (!empresa) return throwError(() => new Error(`La empresa "${row['empresa']}" no existe`));

    const trabajadorTexto = row['trabajador'].trim().toLowerCase();
    const trabajador = this.trabajadoresLookup.find(t => t.nombre_completo.trim().toLowerCase() === trabajadorTexto);
    if (!trabajador) return throwError(() => new Error(`El trabajador "${row['trabajador']}" no existe`));

    const comercialTexto = row['comercial'].trim().toLowerCase();
    const comercial = this.comercialesLookup.find(c => c.nombre_completo.trim().toLowerCase() === comercialTexto);
    if (!comercial) return throwError(() => new Error(`El comercial "${row['comercial']}" no existe`));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(row['fecha_ini'])) {
      return throwError(() => new Error('El campo "fecha_ini" debe tener formato AAAA-MM-DD'));
    }
    if (row['fecha_fin'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['fecha_fin'])) {
      return throwError(() => new Error('El campo "fecha_fin" debe tener formato AAAA-MM-DD'));
    }

    const tarifa = Number(row['tarifa'].replace(',', '.'));
    if (!Number.isFinite(tarifa) || tarifa < 0) {
      return throwError(() => new Error('El campo "tarifa" debe ser un número válido'));
    }

    const data: Omit<Asignacion, 'id'> = {
      id_empresa: empresa.id,
      id_trabajador: trabajador.id,
      id_comerciales: comercial.id,
      fecha_ini: row['fecha_ini'],
      fecha_fin: row['fecha_fin'] || undefined,
      tarifa,
    };

    return this.svc.add(data).pipe(
      map(() => ({})),
      catchError(err => throwError(() => new Error(err?.error?.message || err?.message || 'No se pudo crear la asignación')))
    );
  };

  onCsvImported(): void {
    this.currentPage = 1;
    this.loadData();
  }

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.loadData();
    this.loadCsvLookups();
  }

  private async loadCsvLookups(): Promise<void> {
    this.empresasLookup = await firstValueFrom(this.svc.getEmpresasLookup());
    this.trabajadoresLookup = await firstValueFrom(this.svc.getTrabajadoresLookup());
    this.comercialesLookup = await firstValueFrom(this.svc.getComercialesLookup());
  }

  loadData(): void {
    this.svc.loadAll(this.searchQuery, this.searchField, this.activeFilter, this.currentPage, this.PAGE_SIZE).subscribe();
  }

  // ── Getters para la vista ─────────────────────────
  get selectedAsignacion(): Asignacion | null {
    return this.selectedId != null ? (this.svc.getById(this.selectedId) ?? null) : null;
  }

  // ── Handlers ──────────────────────────────────────
  onSearchChange(text: string): void {
    this.searchQuery = text;
    this.currentPage = 1;
    this.loadData();
  }

  onFilterChange(f: string): void {
    this.currentPage = 1;
    this.activeFilter = f;
    this.loadData();
  }

  onPageChange(p: number): void {
    this.currentPage = p;
    this.loadData();
  }

  openAdd(): void {
    this.selectedId = null;
    this.showForm = true;
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showForm = true;
  }

  onDetailClick(id: number): void {
    this.selectedId = id;
    this.showDetail = true;
  }

  onSaveForm(data: any): void {
    if (this.selectedId) {
      this.svc.update(this.selectedId, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId = null;
          this.loadData();
          this.toast.show('info', `✎ Asignación actualizada correctamente.`);
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo guardar los cambios. Inténtalo de nuevo.';
          this.toast.show('error', `✗ ${msg}`);
        },
      });
    } else {
      this.svc.add(data).subscribe({
        next: () => {
          this.showForm = false;
          this.currentPage = 1;
          this.loadData();
          this.toast.show('success', `✓ Asignación añadida correctamente.`);
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo añadir la asignación. Inténtalo de nuevo.';
          this.toast.show('error', `✗ ${msg}`);
        },
      });
    }
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const c = this.svc.getById(this.selectedId)!;
    const wasActive = c.activo !== false; // Asumimos true por defecto
    this.svc.toggleActivo(this.selectedId).subscribe({
      next: () => {
        this.showBaja = false;
        this.selectedId = null;
        this.loadData();
        if (wasActive) {
          this.toast.show('warning', `⊘ Asignación dada de baja.`);
        } else {
          this.toast.show('success', `↺ Asignación reactivada.`);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo cambiar el estado. Inténtalo de nuevo.';
        this.toast.show('error', `✗ ${msg}`);
      },
    });
  }
}
