import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComercialesApiService, ComercialStats } from '../../../../services/comerciales-api.service';
import { ToastService } from '../../../../services/toast.service';
import { Comercial } from '../../../../models/comercial.model';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ToolbarComponent, FilterType } from '../../components/toolbar/toolbar.component';
import { TableComponent, ColumnDef } from '../../../../shared/table/table.component';
import { ModalAddComponent } from '../../components/modal-add/modal-add.component';
import { ModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { ComercialesModalDetailComponent } from '../../components/modal-detail/comerciales-modal-detail.component';
import { ConfirmMode, ConfirmationModalComponent } from '../../../../shared/confirmation-modal/confirmation-modal.component';

// IMPORTAMOS NUESTRO MODAL CSV
import { ImportCsvModalComponent } from '../../../import-csv/pages/import-csv-page/import-csv-page-component';

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
    ComercialesModalDetailComponent,
    ConfirmationModalComponent,
    ImportCsvModalComponent // LO REGISTRAMOS AQUÍ
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

  // ── Estado: comerciales de la página actual ──
  private readonly _comerciales = signal<Comercial[]>([]);
  readonly comerciales   = this._comerciales.asReadonly();

  // Stats globales del backend
  private readonly _stats = signal<ComercialStats>({ total: 0, activos: 0, inactivos: 0 });
  readonly statsTotal     = computed(() => this._stats().total);
  readonly statsActivos   = computed(() => this._stats().activos);
  readonly statsInactivos = computed(() => this._stats().inactivos);

  // ── Filtros y paginación server-side ─────────────────────────────
  searchQuery   = signal<string>('');
  activeFilter  = signal<FilterType>('todos');
  currentPage   = signal<number>(1);
  totalFiltered = signal<number>(0);
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────────────
  showAdd  = false;
  showEdit = false;
  showBaja = false;
  showDetail = false;
  selectedId = signal<number | null>(null);

  // ── Ciclo de vida ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadPage();
  }

  // ── Helpers de selección ─────────────────────────────────
  get selectedComercial(): Comercial | null {
    const id = this.selectedId();
    if (id === null) return null;
    return this.getById(id) ?? null;
  }

  get existingEmails(): string[] {
    return this.comerciales().map(c => c.email.toLowerCase());
  }

  get existingEmailsForEdit(): string[] {
    const id = this.selectedId();
    if (!id) return [];
    return this.comerciales()
      .filter(c => c.id !== id)
      .map(c => c.email.toLowerCase());
  }

  // ── Carga server-side ─────────────────────────────────────
  private getStatusFilter(): string {
    const filter = this.activeFilter();
    if (filter === 'activos') return 'true';
    if (filter === 'baja')    return 'false';
    return '';
  }

  private loadPage(): void {
    this.api
      .findAll(this.currentPage(), this.PAGE_SIZE, this.searchQuery(), this.getStatusFilter())
      .subscribe({
        next: (page) => {
          this._comerciales.set(page.data);
          this.totalFiltered.set(page.totalFiltered);
          if (page.stats.total > 0 || page.data.length > 0) this._stats.set(page.stats);
        },
        error: () =>
          this.toast.show('error', '✗ No se pudo cargar los comerciales. Inténtalo de nuevo.'),
      });
  }

  // ── Handlers de filtro y paginación ──────────────────────
  onCsvImported(): void {
    this.currentPage.set(1);
    this.loadPage();
  }

  onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
    this.loadPage();
  }

  onFilterChange(f: FilterType): void {
    this.activeFilter.set(f);
    this.currentPage.set(1);
    this.loadPage();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPage();
  }

  // ── Handler unificado para app-table ─────────────────────
  onTableAction({ type, id }: { type: string; id: number }): void {
    if (type === 'edit')    this.onEditClick(id);
    if (type === 'baja')    this.onBajaClick(id);
    if (type === 'activar') this.onBajaClick(id);
  }

  // ── Modales ───────────────────────────────────────────────
  openAdd(): void {
    this.selectedId.set(null);
    this.showAdd = true;
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.showEdit   = true;
  }

  onDetailClick(id: number): void {
    this.selectedId.set(id);
    this.showDetail = true;
  }

  onBajaClick(id: number): void {
    this.selectedId.set(id);
    this.showBaja   = true;
  }

  // ── CRUD: recarga la página tras cada mutación ────────────
  onSaveAdd(data: Omit<Comercial, 'id'>): void {
    this.api.create({ ...data, id: null }).subscribe({
      next: () => {
        this.showAdd     = false;
        this.currentPage.set(1);
        this.loadPage();
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
        this.selectedId.set(null);
        this.loadPage();
        this.toast.show('info', `✎ Comercial <strong>${data.nombre} ${data.primer_apellido}</strong> actualizado`);
      },
      error: () =>
        this.toast.show('error', '✗ No se pudo guardar los cambios. Inténtalo de nuevo.'),
    });
  }

  onConfirmBaja(): void {
    const id = this.selectedId();
    if (id == null) return;
    const c        = this.getById(id)!;
    const wasActive = c.activo;

    this.api.toggleStatus(id).subscribe({
      next: () => {
        this.showBaja   = false;
        this.selectedId.set(null);
        this.loadPage();
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
