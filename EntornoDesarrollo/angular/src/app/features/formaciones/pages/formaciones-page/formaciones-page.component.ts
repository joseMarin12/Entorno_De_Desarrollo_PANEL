import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, catchError, firstValueFrom, map, throwError } from 'rxjs';

import { FormacionesService } from '../../../../services/formaciones.service';
import { ToastService } from '../../../../services/toast.service';
import { Formacion } from '../../../../models/formacion.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { SharedFilterComponent } from '../../../../shared/shared-filter/shared-filter.component';
import { CsvColumnDef, CsvImportRowOutcome } from '../../../../shared/csv-import/csv-import.component';
import { FormacionesTableComponent } from '../../components/formaciones-table/formaciones-table.component';
import { ModalFormacionComponent } from '../../components/modal-formacion/modal-formacion.component';
import { ModalParticipantesComponent } from '../../components/modal-participantes/modal-participantes.component';
import { FormacionesModalDetailComponent } from '../../components/modal-detail/formaciones-modal-detail.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';

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
    FormacionesModalDetailComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './formaciones-page.component.html',
})
export class FormacionesPageComponent implements OnInit {
  svc = inject(FormacionesService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

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
  showDetail = false;
  readonly selectedId = signal<number | null>(null);

  // ── Carga masiva CSV ──────────────────────────────
  private areas: { id: number; nombre: string }[] = [];
  private modalidades: { id: number; nombre: string }[] = [];
  private ejecuciones: { id: number; nombre: string }[] = [];
  responsables: { id: number; name: string }[] = [];

  readonly csvColumns: CsvColumnDef[] = [
    { key: 'curso', label: 'curso', required: true, hint: 'Nombre del curso' },
    { key: 'denominacion', label: 'denominacion', required: true, hint: 'Descripción o título de la formación' },
    { key: 'area', label: 'area', required: true, hint: 'Técnica, Habilidades blandas, Seguridad, Idiomas, Gestión y liderazgo u Otros' },
    { key: 'modalidad', label: 'modalidad', required: true, hint: 'Presencial, Online, Semipresencial o A distancia' },
    { key: 'ejecucion', label: 'ejecucion', required: true, hint: 'Interna, Externa o Mixta' },
    { key: 'responsable', label: 'responsable', required: true, hint: 'Nombre de un usuario ya existente' },
    { key: 'fecha_prevista', label: 'fecha_prevista (AAAA-MM-DD)', required: true, hint: 'Formato AAAA-MM-DD, ej. 2026-09-01' },
    { key: 'fecha_inicio', label: 'fecha_inicio (AAAA-MM-DD)', required: true, hint: 'Formato AAAA-MM-DD' },
    { key: 'fecha_fin', label: 'fecha_fin (AAAA-MM-DD)', required: true, hint: 'Formato AAAA-MM-DD' },
    { key: 'horario', label: 'horario', required: false, hint: 'Ej. 09:00-13:00 (opcional)' },
    { key: 'recursos', label: 'recursos', required: false, hint: 'Materiales o licencias necesarias (opcional)' },
  ];

  csvRowLabel = (row: Record<string, string>): string => row['curso'];

  csvImportRow = (row: Record<string, string>): Observable<CsvImportRowOutcome> => {
    const findByNombre = (list: { id: number; nombre: string }[], texto: string) =>
      list.find(x => x.nombre.trim().toLowerCase() === texto.trim().toLowerCase());

    const area = findByNombre(this.areas, row['area']);
    if (!area) return throwError(() => new Error(`El área "${row['area']}" no existe`));

    const modalidad = findByNombre(this.modalidades, row['modalidad']);
    if (!modalidad) return throwError(() => new Error(`La modalidad "${row['modalidad']}" no existe`));

    const ejecucion = findByNombre(this.ejecuciones, row['ejecucion']);
    if (!ejecucion) return throwError(() => new Error(`La ejecución "${row['ejecucion']}" no existe`));

    const responsableTexto = row['responsable'].trim().toLowerCase();
    const responsable = this.responsables.find(r => r.name.trim().toLowerCase() === responsableTexto);
    if (!responsable) return throwError(() => new Error(`El responsable "${row['responsable']}" no existe`));

    const fechaValida = (f: string) => /^\d{4}-\d{2}-\d{2}$/.test(f);
    for (const campo of ['fecha_prevista', 'fecha_inicio', 'fecha_fin'] as const) {
      if (!fechaValida(row[campo])) {
        return throwError(() => new Error(`El campo "${campo}" debe tener formato AAAA-MM-DD`));
      }
    }

    const data: Omit<Formacion, 'id'> = {
      curso: row['curso'].trim(),
      denominacion: row['denominacion'].trim(),
      motivo: '',
      id_area: area.id,
      recursos: row['recursos'] || '',
      id_responsable: responsable.id,
      id_modalidad: modalidad.id,
      duracion: 0,
      dentro_fuera_jornada: '',
      observaciones: '',
      fecha_prevista: row['fecha_prevista'],
      fecha_inicio: row['fecha_inicio'],
      fecha_fin: row['fecha_fin'],
      horario: row['horario'] || '',
      id_ejecucion: ejecucion.id,
      eficacia: '',
      anio: new Date(row['fecha_inicio']).getFullYear(),
      coste: 0,
      bonificacion: 0,
      total: 0,
      id_estado: 1,
      activo: true,
    };

    return this.svc.add(data).pipe(
      map(() => ({})),
      catchError(err => throwError(() => new Error(err?.error?.message || err?.message || 'No se pudo crear la formación')))
    );
  };

  onCsvImported(): void {
    this.loadData();
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
    this.loadCsvLookups();
  }

  private async loadCsvLookups(): Promise<void> {
    this.areas = await firstValueFrom(this.svc.getAreas());
    this.modalidades = await firstValueFrom(this.svc.getModalidades());
    this.ejecuciones = await firstValueFrom(this.svc.getEjecuciones());
    this.responsables = await firstValueFrom(this.svc.getResponsables());
  }

  loadData(): void {
    this.svc.loadAll(this.searchQuery, this.searchField, this.activeFilter, this.currentPage, this.PAGE_SIZE).subscribe();
  }

  // ── Getters para la vista ─────────────────────────
  readonly selectedformacion = computed<Formacion | null>(() => {
    const id = this.selectedId();
    return id != null ? (this.svc.getById(id) ?? null) : null;
  });

  readonly selectedResponsableNombre = computed<string>(() => {
    const formacion = this.selectedformacion();
    const idResponsable = formacion?.id_responsable;
    if (idResponsable == null) return '';
    return this.responsables.find(r => r.id === Number(idResponsable))?.name ?? '';
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

  onDetailClick(id: number): void {
    this.selectedId.set(id);
    this.showDetail = true;
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
}
