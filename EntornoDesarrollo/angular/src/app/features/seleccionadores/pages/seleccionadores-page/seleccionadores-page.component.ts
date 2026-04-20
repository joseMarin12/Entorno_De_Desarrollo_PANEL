import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SeleccionadoresApiService } from '../../../../services/seleccionadores-api.service';
import { ToastService } from '../../../../services/toast.service';
import { Seleccionador, getColorFor, getInitials } from '../../../../models/seleccionador.model';

import { SelStatsRowComponent } from '../../components/stats-row/sel-stats-row.component';
import { SelToolbarComponent, SelFilterType, SelFilterTipoType } from '../../components/toolbar/sel-toolbar.component';
import { SelModalFormComponent } from '../../components/modal-form/sel-modal-form.component';
import { SelModalDetailComponent } from '../../components/modal-detail/sel-modal-detail.component';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { ColumnDef, TableComponent } from '../../../../shared/table/table.component';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-seleccionadores-page',
  standalone: true,
  imports: [
    CommonModule,
    SelStatsRowComponent,
    SelToolbarComponent,
    TableComponent,
    SelModalFormComponent,
    SelModalDetailComponent,
    TopbarComponent,
    ConfirmationModalComponent
  ],
  templateUrl: './seleccionadores-page.component.html',
})
export class SeleccionadoresPageComponent implements OnInit {
  api   = inject(SeleccionadoresApiService);
  toast = inject(ToastService);

  // ── Estado Local (Migrado desde el servicio) ─────────────────
  private readonly _seleccionadores = signal<Seleccionador[]>([]);
  private readonly _empresas = signal<{id: number, nombre: string}[]>([]);

  readonly empresasDisponibles = this._empresas.asReadonly();
  
  // Intercepta los seleccionadores y mapea su empresa si el backend omitió el anidado
  readonly seleccionadores = computed(() => {
    const empresas = this._empresas();
    return this._seleccionadores().map(s => {
      if (s.tipo === 'externo' && s.id_empresa && !s.empresa) {
        const emp = empresas.find(e => e.id === s.id_empresa);
        if (emp) {
          return { ...s, empresa: { id: emp.id, nombre: emp.nombre || (emp as any).nombre_empresa } };
        }
      }
      return s;
    });
  });

  readonly total           = computed(() => this.seleccionadores().length);
  readonly activos         = computed(() => this.seleccionadores().filter(s => s && s.activo).length);
  readonly inactivos       = computed(() => this.seleccionadores().filter(s => s && !s.activo).length);
  readonly externos        = computed(() => this.seleccionadores().filter(s => s && s.tipo === 'externo').length);

  // ── Configuración Tabla ─────────────────────────────────────
  tableColumns: ColumnDef[] = [
    {
      header: 'Nombre',
      type: 'avatar-name',
      nameFields: ['nombre', 'primer_apellido', 'segundo_apellido'],
      activeField: 'activo',
      colorFn: (id) => getColorFor(id),
      initialsFn: (row) => getInitials(row)
    },
    {
      header: 'Tipo',
      type: 'enum-badge',
      field: 'tipo',
      enumMap: {
        interno: { label: 'Interno', background: '#e8eaf6', color: '#3949ab' },
        externo: { label: 'Externo', background: '#fff3e0', color: '#e65100' }
      }
    },
    {
      header: 'Empresas vinculadas',
      type: 'relation-chip',
      skipField: 'tipo',
      skipValue: 'interno',
      relationField: 'empresa',
      relationNameField: 'nombre',
      emptyLabel: 'Sin empresa'
    },
    {
      header: 'Estado',
      type: 'status-badge',
      activeField: 'activo',
      inactiveLabel: 'De baja'
    },
    {
      header: 'Acciones',
      type: 'actions',
      actions: [
        { type: 'detail', title: 'Ver detalle', icon: 'eye', variant: 'view' },
        { type: 'edit', title: 'Editar', icon: 'edit', variant: 'edit' },
        {
          type: 'baja',
          title: 'Dar de Baja',
          icon: 'alert-circle',
          variant: 'danger',
          showWhen: 'active',
          activeField: 'activo'
        },
        {
          type: 'activar',
          title: 'Activar',
          icon: 'check-circle',
          variant: 'success',
          showWhen: 'inactive',
          activeField: 'activo'
        }
      ]
    }
  ];

  selectedSeleccionador: Seleccionador | null = null;
  selectedSeleccionadorNombre = signal<string | null>(null);

  // ── Filtros ───────────────────────────────────────────
  searchQuery:   string        = '';
  activeFilter:  SelFilterType = '';
  typeFilter:    SelFilterTipoType = '';
  currentPage = 1;
  readonly PAGE_SIZE = 6;

  // ── Estado modales ────────────────────────────────────
  showForm    = false;
  showConfirm = false;
  showDetail  = false;
  confirmMode = ConfirmMode.DESACTIVAR;
  selectedId: number | null = null;
  ConfirmMode = ConfirmMode;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(searchText = '', status = ''): void {
    forkJoin({
      seleccionadores: this.api.findAll(searchText, status),
      empresas: this.api.getEmpresas()
    }).subscribe({
      next: ({ seleccionadores, empresas }) => {
        this._empresas.set(empresas ?? []);
        this._seleccionadores.set(seleccionadores ?? []);
      },
      error: () => this.toast.show('error', '✗ No se pudieron cargar los datos.')
    });
  }

  // ── Computed Filtros ──────────────────────────────────────────
  get filtered(): Seleccionador[] {
    const data = this.seleccionadores();
    if (!Array.isArray(data)) return [];

    const q = this.searchQuery.toLowerCase().trim();
    return data.filter(s => {
      if (!s) return false;
      let matchFilter = true;
      if (this.activeFilter === 'activo') matchFilter = s.activo;
      else if (this.activeFilter === 'baja') matchFilter = !s.activo;

      const matchType = this.typeFilter === '' ? true : s.tipo === this.typeFilter;
      const text = `${s.nombre} ${s.primer_apellido} ${s.segundo_apellido} ${s.email}`.toLowerCase();
      const matchSearch = !q || text.includes(q);

      return matchFilter && matchType && matchSearch;
    });
  }

  get paginated(): Seleccionador[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  getById(id: number): Seleccionador | undefined {
    return this.seleccionadores().find(s => s.id === id);
  }

  // ── Handlers ─────────────────────────────────────────
  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage = 1;
  }

  onFilterChange(f: SelFilterType): void {
    this.activeFilter = f;
    this.currentPage = 1;
  }

  onTypeFilterChange(t: SelFilterTipoType): void {
    this.typeFilter = t;
    this.currentPage = 1;
  }

  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'detail': this.onDetailClick(event.id); break;
      case 'edit': this.onEditClick(event.id); break;
      case 'baja': this.onBajaClick(event.id); break;
      case 'activar': this.onActivarClick(event.id); break;
    }
  }

  openAdd(): void {
    this.selectedId = null;
    this.selectedSeleccionador = null;
    this.showForm = true;
  }

  onDetailClick(id: number): void {
    this.selectedId = id;
    this.selectedSeleccionador = this.getById(id) ?? null;
    this.showDetail = true;
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.selectedSeleccionador = this.getById(id) ?? null;
    this.showForm = true;
  }

  onSaveForm(data: Omit<Seleccionador, 'id'>): void {
    if (this.selectedId != null) {
      this.api.update(this.selectedId, data).subscribe({
        next: (updated) => {
          this._seleccionadores.update(list => list.map(s => s.id === this.selectedId ? updated : s));
          const name = `${data.nombre} ${data.primer_apellido}`;
          this.toast.show('info', `✎ Seleccionador <strong>${name}</strong> actualizado`);
          this.closeForm();
        },
        error: () => this.toast.show('error', '✗ Error al actualizar seleccionador')
      });
    } else {
      this.api.create(data).subscribe({
        next: (created) => {
          this._seleccionadores.update(list => [created, ...list]);
          const name = `${data.nombre} ${data.primer_apellido}`;
          this.toast.show('success', `✓ Seleccionador <strong>${name}</strong> añadido`);
          this.closeForm();
        },
        error: () => this.toast.show('error', '✗ Error al crear seleccionador')
      });
    }
  }

  private closeForm() {
    this.showForm = false;
    this.selectedId = null;
    this.selectedSeleccionador = null;
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.confirmMode = ConfirmMode.DESACTIVAR;
    const seleccionador = this.getById(this.selectedId);
    this.selectedSeleccionadorNombre.set(seleccionador ? `${seleccionador.nombre} ${seleccionador.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onActivarClick(id: number): void {
    this.selectedId = id;
    this.confirmMode = ConfirmMode.ACTIVAR;
    const seleccionador = this.getById(this.selectedId);
    this.selectedSeleccionadorNombre.set(seleccionador ? `${seleccionador.nombre} ${seleccionador.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onConfirm(): void {
    if (this.selectedId == null) return;
    const s = this.getById(this.selectedId)!;
    const name = `${s.nombre} ${s.primer_apellido}`;
    const wasActive = s.activo;
    
    this.api.toggleStatus(this.selectedId).subscribe({
      next: (updated) => {
        this._seleccionadores.update(list => list.map(item => item.id === this.selectedId ? updated : item));
        this.showConfirm = false;
        this.selectedId = null;
        if (wasActive) {
          this.toast.show('warning', `⊘ Seleccionador <strong>${name}</strong> dado de baja`);
        } else {
          this.toast.show('success', `↺ Seleccionador <strong>${name}</strong> reactivado`);
        }
      },
      error: () => this.toast.show('error', '✗ Error al cambiar el estado')
    });
  }
}
