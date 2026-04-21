import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { ToastService } from '../../../../services/toast.service';
import { Comercial } from '../../../../models/comercial.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { TableComponent, ColumnDef } from '../../../../shared/table/table.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ConfirmMode, ConfirmationModalComponent } from '../../../../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-comerciales-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    TableComponent,
    ModalAddComponent,
    ModalEditComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './comerciales-page.component.html',
})
export class ComercialesPageComponent implements OnInit {
  api   = inject(ComercialesApiService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;

  // ── Definición de columnas para shared/table ──────────────
  readonly columns: ColumnDef[] = [
    {
      header: 'Nombre',
      type: 'avatar-name',
      nameFields: ['nombre', 'primer_apellido', 'segundo_apellido'],
      activeField: 'activo',
      colorFn: (id: number) => this.colorFor(id),
      initialsFn: (row: Comercial) =>
        ((row.nombre?.[0] ?? '') + (row.primer_apellido?.[0] ?? '')).toUpperCase(),
    },
    { header: 'Teléfono', type: 'text',  field: 'telefono' },
    { header: 'Email',    type: 'text',  field: 'email',   activeField: 'activo' },
    {
      header: 'Estado',
      type: 'status-badge',
      activeField: 'activo',
      activeLabel: 'Activo',
      inactiveLabel: 'De baja',
    },
    {
      header: 'Acciones',
      type: 'actions',
      actions: [
        { type: 'edit',    icon: 'edit',         variant: 'edit',    title: 'Editar',       showWhen: 'always'   },
        { type: 'baja',    icon: 'alert-circle',  variant: 'danger',  title: 'Dar de baja',  showWhen: 'active',   activeField: 'activo' },
        { type: 'activar', icon: 'check-circle',  variant: 'success', title: 'Activar',      showWhen: 'inactive', activeField: 'activo' },
      ],
    },
  ];

  // ── Estado: todos los comerciales traídos del servidor ──
  private readonly _comerciales = signal<Comercial[]>([]);
  readonly comerciales   = this._comerciales.asReadonly();

  // Paginación en cliente
  readonly paginatedComerciales = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this._comerciales().slice(start, start + this.PAGE_SIZE);
  });

  // Contadores calculados en cliente
  readonly totalRecords   = computed(() => this._comerciales().length);
  readonly totalActivos   = computed(() => this._comerciales().filter(c => c.activo).length);
  readonly totalInactivos = computed(() => this._comerciales().filter(c => !c.activo).length);

  // ── Filtros y paginación ──────────────────────────────────
  searchQuery   = '';
  activeFilter: FilterType = 'todos';
  currentPage   = signal(1);
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────────────
  showAdd  = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Ciclo de vida ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
  }

  // ── Helpers de selección ─────────────────────────────────
  get selectedComercial(): Comercial | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  /**
   * Emails de la página actual.
   * La unicidad global la garantiza la restricción UNIQUE de PostgreSQL;
   * si hay duplicado fuera de esta página, el backend lo rechazará.
   */
  get existingEmails(): string[] {
    return this.comerciales().map(c => c.email.toLowerCase());
  }

  get existingEmailsForEdit(): string[] {
    if (!this.selectedId) return [];
    return this.comerciales()
      .filter(c => c.id !== this.selectedId)
      .map(c => c.email.toLowerCase());
  }

  // ── Carga server-side ─────────────────────────────────────
  private getStatusFilter(): string {
    if (this.activeFilter === 'activos') return 'true';
    if (this.activeFilter === 'baja')    return 'false';
    return '';
  }

  private loadAll(): void {
    this.api
      .findAll(this.searchQuery, this.getStatusFilter(), 1, 1000)
      .subscribe({
        next: (res) => {
          this._comerciales.set(res.data ?? []);
        },
        error: () =>
          this.toast.show('error', '✗ No se pudo cargar los comerciales. Inténtalo de nuevo.'),
      });
  }

  // ── Handlers de filtro y paginación ──────────────────────
  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage.set(1);
    this.loadAll();
  }

  onFilterChange(f: FilterType): void {
    this.activeFilter = f;
    this.currentPage.set(1);
    this.loadAll();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  // ── Handler unificado para app-table ─────────────────────
  onTableAction({ type, id }: { type: string; id: number }): void {
    if (type === 'edit')    this.onEditClick(id);
    if (type === 'baja')    this.onBajaClick(id);
    if (type === 'activar') this.onBajaClick(id);
  }

  // ── Modales ───────────────────────────────────────────────
  openAdd(): void { this.showAdd = true; }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit   = true;
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja   = true;
  }

  // ── CRUD: recarga la página tras cada mutación ────────────
  onSaveAdd(data: Omit<Comercial, 'id'>): void {
    this.api.create({ ...data, id: null }).subscribe({
      next: () => {
        this.showAdd     = false;
        this.currentPage.set(1);         // volver a la primera página para ver el nuevo registro
        this.loadAll();
        this.toast.show('success', `✓ Comercial <strong>${data.nombre} ${data.primer_apellido}</strong> añadido correctamente`);
      },
      error: (err) => {
        const isDuplicate =
          err?.error?.message?.toLowerCase().includes('unique') ||
          err?.error?.message?.toLowerCase().includes('duplicate') ||
          err?.error?.message?.toLowerCase().includes('ya existe');
        this.toast.show(
          'error',
          isDuplicate
            ? '✗ El email ya está registrado.'
            : '✗ No se pudo añadir el comercial. Inténtalo de nuevo.',
        );
      },
    });
  }

  onSaveEdit(data: Comercial): void {
    this.api.update(data.id!, data).subscribe({
      next: () => {
        this.showEdit   = false;
        this.selectedId = null;
        this.loadAll();
        this.toast.show('info', `✎ Comercial <strong>${data.nombre} ${data.primer_apellido}</strong> actualizado`);
      },
      error: () =>
        this.toast.show('error', '✗ No se pudo guardar los cambios. Inténtalo de nuevo.'),
    });
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const c        = this.getById(this.selectedId)!;
    const wasActive = c.activo;

    this.api.toggleStatus(this.selectedId).subscribe({
      next: () => {
        this.showBaja   = false;
        this.selectedId = null;
        this.loadAll();
        if (wasActive) {
          this.toast.show('warning', `⊘ Comercial <strong>${this.fullName(c)}</strong> dado de baja`);
        } else {
          this.toast.show('success', `↺ Comercial <strong>${this.fullName(c)}</strong> reactivado`);
        }
      },
      error: () =>
        this.toast.show('error', '✗ No se pudo cambiar el estado. Inténtalo de nuevo.'),
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  getById(id: number): Comercial | undefined {
    return this._comerciales().find(c => c.id === id);
  }

  fullName(c: Comercial): string {
    return [c.nombre, c.primer_apellido, c.segundo_apellido].filter(Boolean).join(' ');
  }

  colorFor(id: number): string {
    const COLORS = [
      'linear-gradient(135deg,#5a4d9a,#476fab)',
      'linear-gradient(135deg,#476fab,#23b4cd)',
      'linear-gradient(135deg,#3198bf,#23b4cd)',
      'linear-gradient(135deg,#55569e,#3198bf)',
      'linear-gradient(135deg,#5a4d9a,#23b4cd)',
    ];
    return COLORS[((id ?? 0) - 1 + COLORS.length) % COLORS.length];
  }
}
