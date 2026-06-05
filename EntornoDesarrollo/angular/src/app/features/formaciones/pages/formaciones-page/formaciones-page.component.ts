import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormacionesService } from '../../../../services/formaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Formacion } from '../../../../models/formacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { SharedFilterComponent } from '../../../../shared/shared-filter/shared-filter.component';
import { FormacionesTableComponent } from '../../components/formaciones-table/formaciones-table.component';
import { ModalFormacionComponent } from '../../components/modal-formacion/modal-formacion.component';
import { ModalParticipantesComponent } from '../../components/modal-participantes/modal-participantes.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { CsvColumnDef } from '../../../../shared/csv-import-export/csv.service';
import { CsvImportExportComponent } from '../../../../shared/csv-import-export/csv-import-export.component';

@Component({
  selector: 'app-formaciones-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    StatsRowComponent,
    SharedFilterComponent,
    FormacionesTableComponent,
    ModalFormacionComponent,
    ModalParticipantesComponent,
    ConfirmationModalComponent,
    CsvImportExportComponent
  ],
  templateUrl: './formaciones-page.component.html',
})
export class FormacionesPageComponent implements OnInit {
  svc = inject(FormacionesService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  csvColumns: CsvColumnDef[] = [
    { key: 'curso',      header: 'curso',       type: 'text', example: 'Curso Ejemplo' },
    { key: 'denominacion', header: 'denominacion',  type: 'text', example: 'Ej: Curso avanzado de...' },
    { key: 'motivo',         header: 'motivo',           type: 'text', example: 'Ej: Formación técnica' },
    { key: 'recursos',        header: 'recursos',          type: 'text', example: 'Ej: Aula, proyector...' },
    { key: 'duracion',   header: 'duracion (horas)',     type: 'text', example: 'Ej: 2' },
    { key: 'dentro_fuera_jornada',      header: 'dentro_fuera_jornada',        type: 'text', example: 'Dentro / Fuera' },
    { key: 'observaciones',      header: 'observaciones',        type: 'text', example: 'Observaciones' },
    { key: 'fecha_prevista',      header: 'fecha_prevista',        type: 'date', example: 'YYYY-MM-DD' },
    { key: 'fecha_inicio',      header: 'fecha_inicio',        type: 'date', example: 'YYYY-MM-DD' },
    { key: 'fecha_fin',      header: 'fecha_fin',        type: 'date', example: 'YYYY-MM-DD' },
    { key: 'horario',      header: 'horario',        type: 'text', example: 'Ej: 10:00-12:00' },
    { key: 'eficacia',     header: 'eficacia',        type: 'text', example: 'Ej: Alta' },
    { key: 'anio',        header: 'anio',           type: 'number', example: 'Ej: 2024' },
    { key: 'coste',       header: 'coste',          type: 'number', example: 'Ej: 1000' },
    { key: 'bonificacion', header: 'bonificacion',    type: 'number', example: 'Ej: 200' },
    { key: 'activo',      header: 'activo (true:1/false:0)',        type: 'boolean', example: 'Ej: true' },
    { key: 'area_nombre', header: 'area', type: 'text', example: 'Ej: Técnica' },
    { key: 'modalidad_nombre', header: 'modalidad', type: 'text', example: 'Ej: Presencial' },
    { key: 'ejecucion_nombre', header: 'ejecucion', type: 'text', example: 'Ej: Interna' },
    { key: 'responsable_nombre', header: 'responsable', type: 'text', example: 'Ej: Juan Pérez' },
  ];

  // ── Filtros ──────────────────────────────────────
  searchQuery = '';
  searchField = '';
  activeFilter: string = 'todos';
  currentPage = 1;
  readonly PAGE_SIZE = 10; // Actualizado a 10 según petición

  // ── Estado modales ────────────────────────────────
  showForm = false;
  showBaja = false;
  showParticipantes = false;
  readonly selectedId = signal<number | null>(null);

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.svc.loadAll(this.searchQuery, this.searchField, this.activeFilter, this.currentPage, this.PAGE_SIZE).subscribe();
  }

  // ── Getters para la vista ─────────────────────────
  readonly selectedformacion = computed<Formacion | null>(() => {
    const id = this.selectedId();
    return id != null ? (this.svc.getById(id) ?? null) : null;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  onSearchChange(text: string): void {
    this.searchQuery = text;
    this.currentPage = 1;
    this.loadData();
  }

  onFilterChange(f: string): void {
    this.activeFilter = f;
    this.currentPage = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  openAdd(): void {
    this.selectedId.set(null);
    this.showForm = true;
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.showForm = true;
  }

  onSaveForm(data: any): void {
    const id = this.selectedId();
    if (id) {
      // Editar
      this.svc.update(id, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId.set(null);
          this.toast.show('info', `✎ Formación <strong>${data.curso}</strong> actualizada`);
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo guardar los cambios. Inténtalo de nuevo.';
          this.toast.show('error', `✗ ${msg}`);
        },
      });
    } else {
      // Añadir
      this.svc.add(data).subscribe({
        next: () => {
          this.showForm = false;
          this.toast.show('success', `✓ Formación <strong>${data.curso}</strong> añadida correctamente`);
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo añadir la formación. Inténtalo de nuevo.';
          this.toast.show('error', `✗ ${msg}`);
        },
      });
    }
  }

  onBajaClick(id: number): void {
    this.selectedId.set(id);
    this.showBaja = true;
  }

  onParticipantesClick(id: number): void {
    this.selectedId.set(id);
    this.showParticipantes = true;
  }

  onConfirmBaja(): void {
    const id = this.selectedId();
    if (id == null) return;
    const c = this.svc.getById(id)!;
    const wasActive = c.activo === true;
    this.svc.toggleActivo(id).subscribe({
      next: () => {
        this.showBaja = false;
        this.selectedId.set(null);
        if (wasActive) {
          this.toast.show('warning', `⊘ Formación <strong>${this.svc.title(c)}</strong> dada de baja`);
        } else {
          this.toast.show('success', `↺ Formación <strong>${this.svc.title(c)}</strong> reactivada`);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo cambiar el estado. Inténtalo de nuevo.';
        this.toast.show('error', `✗ ${msg}`);
      },
    });
  }

  onImportCsv(rows: any[]): void {
    console.log('Importar CSV:', rows);
  }
}
