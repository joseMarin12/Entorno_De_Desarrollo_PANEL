import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AsignacionesService } from '../../../../services/asignaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Asignacion } from '../../../../models/asignacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { SharedFilterComponent } from '../../../../shared/shared-filter/shared-filter.component';
import { AsignacionesTableComponent } from '../../components/asignaciones-table/asignaciones-table.component';
import { ModalAsignacionComponent } from '../../components/modal-asignacion/modal-asignacion.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';
import { CsvImportExportComponent } from '../../../../shared/csv-import-export/csv-import-export.component';
import { CsvColumnDef } from '../../../../shared/csv-import-export/csv.service';

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
    ConfirmationModalComponent,
    CsvImportExportComponent
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

  csvColumns: CsvColumnDef[] = [
    { key: 'id_empresa', header: 'id_empresa', type: 'number' },
    { key: 'id_trabajador', header: 'id_trabajador', type: 'number' },
    { key: 'id_comerciales', header: 'id_comerciales', type: 'number' },
    { key: 'fecha_ini', header: 'fecha_ini', type: 'date' },
    { key: 'fecha_fin', header: 'fecha_fin', type: 'date' },
    { key: 'tarifa', header: 'tarifa', type: 'number' },
    { key: 'activo', header: 'activo', type: 'boolean' }
  ];

  // ── Estado modales ────────────────────────────────
  showForm = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────
  ngOnInit(): void {
    this.loadData();
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

  onSaveForm(data: any): void {
    if (this.selectedId) {
      this.svc.update(this.selectedId, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId = null;
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
          this.toast.show('success', `✓ Asignación añadida correctamente.`);
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo añadir la asignación. Inténtalo de nuevo.';
          this.toast.show('error', `✗ ${msg}`);
        },
      });
    }
  }

  onImportCsv(rows: any[]): void {
    let success = 0;
    let errors = 0;
    
    const importNext = (index: number) => {
      if (index >= rows.length) {
        this.toast.show(errors === 0 ? 'success' : 'warning', `Importación finalizada. ${success} correctos, ${errors} errores.`);
        this.loadData();
        return;
      }
      
      const row = rows[index];
      const { id, created_at, updated_at, ...cleanRow } = row;
      
      const payload = {
        ...cleanRow,
        id_empresa: cleanRow.id_empresa ? Number(cleanRow.id_empresa) : null,
        id_trabajador: cleanRow.id_trabajador ? Number(cleanRow.id_trabajador) : null,
        id_comerciales: cleanRow.id_comerciales ? Number(cleanRow.id_comerciales) : null,
        tarifa: cleanRow.tarifa ? Number(cleanRow.tarifa) : null,
        activo: cleanRow.activo === 'true' || cleanRow.activo === true || cleanRow.activo === 1 || cleanRow.activo === '1',
      };

      this.svc.add(payload).subscribe({
        next: () => { success++; importNext(index + 1); },
        error: () => { errors++; importNext(index + 1); }
      });
    };
    
    if (rows.length > 0) {
      importNext(0);
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
