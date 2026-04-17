import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SeleccionadoresService } from '../../../../services/seleccionadores.service';
import { ToastService } from '../../../../services/toast.service';
import { Seleccionador } from '../../../../models/seleccionador.model';

import { SelStatsRowComponent } from '../../components/stats-row/sel-stats-row.component';
import { SelToolbarComponent, SelFilterType, SelFilterTipoType } from '../../components/toolbar/sel-toolbar.component';
import { SelModalFormComponent } from '../../components/modal-form/sel-modal-form.component';
import { SelModalDetailComponent } from '../../components/modal-detail/sel-modal-detail.component';

import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { ConfirmationModalComponent, ConfirmMode } from "../../../../shared/confirmation-modal/confirmation-modal.component";
import { ColumnDef, TableComponent } from '../../../../shared/table/table.component';

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
export class SeleccionadoresPageComponent {
  svc   = inject(SeleccionadoresService);
  toast = inject(ToastService);

  tableColumns: ColumnDef[] = [
    {
      header: 'Nombre',
      type: 'avatar-name',
      nameFields: ['nombre', 'primer_apellido', 'segundo_apellido'],
      activeField: 'activo',
      colorFn: (id) => this.svc.colorFor(id),
      initialsFn: (row) => this.svc.initials(row)
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
      relationField: 'empresaVinculada',
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
  ConfirmMode = ConfirmMode; // Exponer enum a la plantilla


  // ── Computed ──────────────────────────────────────────
  get filtered(): Seleccionador[] {
    const data = this.svc.seleccionadores();
    if (!Array.isArray(data)) return [];

    const q = this.searchQuery.toLowerCase().trim();
    return data.filter(s => {
      if (!s) return false;
      // Filtro de estado (Activo/Inactivo)
      let matchFilter = true;
      if (this.activeFilter === 'activo') {
        matchFilter = s.activo;
      } else if (this.activeFilter === 'baja') {
        matchFilter = !s.activo;
      }

      // Filtro de tipo (Interno/Externo)
      const matchType =
        this.typeFilter === '' ? true : s.tipo === this.typeFilter;

      // Filtro de búsqueda por texto
      const text = `${s.nombre} ${s.primer_apellido} ${s.segundo_apellido} ${s.email}`.toLowerCase();
      const matchSearch = !q || text.includes(q);

      return matchFilter && matchType && matchSearch;
    });
  }

  get paginated(): Seleccionador[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
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
      case 'detail':
        this.onDetailClick(event.id);
        break;
      case 'edit':
        this.onEditClick(event.id);
        break;
      case 'baja':
        this.onBajaClick(event.id);
        break;
      case 'activar':
        this.onActivarClick(event.id);
        break;
      default:
        break;
    }
  }

  openAdd(): void {
    this.selectedId = null;
    this.showForm = true;
  }

  onDetailClick(id: number): void {
    this.selectedId = id;
    this.selectedSeleccionador = this.svc.getById(id) ?? null;
    this.showDetail = true;
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.selectedSeleccionador = this.svc.getById(id) ?? null;
    this.showForm = true;
  }

  async onSaveForm(data: Omit<Seleccionador, 'id'>): Promise<void> {
    console.log('📩 Página recibió evento "save". Procesando...', data);
    if (this.selectedId != null) {
      await this.svc.update(this.selectedId, data);
      const name = `${data.nombre} ${data.primer_apellido}`;
      this.toast.show('info', `✎ Seleccionador <strong>${name}</strong> actualizado`);
    } else {
      await this.svc.add(data);
      const name = `${data.nombre} ${data.primer_apellido}`;
      this.toast.show('success', `✓ Seleccionador <strong>${name}</strong> añadido`);
    }
    this.showForm = false;
    this.selectedId = null;
    this.selectedSeleccionador = null;
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.confirmMode = ConfirmMode.DESACTIVAR;
    const seleccionador = this.svc.getById(this.selectedId);
    this.selectedSeleccionadorNombre.set(seleccionador ? `${seleccionador.nombre} ${seleccionador.primer_apellido}` : null);
    this.showConfirm = true;
  }

  onActivarClick(id: number): void {
    this.selectedId = id;
    this.confirmMode = ConfirmMode.ACTIVAR;
    const seleccionador = this.svc.getById(this.selectedId);
    this.selectedSeleccionadorNombre.set(seleccionador ? `${seleccionador.nombre} ${seleccionador.primer_apellido}` : null);
    this.showConfirm = true;
  }

  async onConfirm(): Promise<void> {
    if (this.selectedId == null) return;
    const s = this.svc.getById(this.selectedId)!;
    const name = `${s.nombre} ${s.primer_apellido}`;
    await this.svc.toggleActivo(this.selectedId);
    this.showConfirm = false;

    if (this.confirmMode === ConfirmMode.DESACTIVAR) {
      this.toast.show('warning', `⊘ Seleccionador <strong>${name}</strong> dado de baja`);
    } else {
      this.toast.show('success', `↺ Seleccionador <strong>${name}</strong> reactivado`);
    }
    this.selectedId = null;
  }
}
