import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { StatsRowComponent } from '../../contactos-empresas/components/stats-row/stats-row.component';
import { ContactoFilterCargoType, ContactoFilterType, ToolbarComponent } from '../components/toolbar/toolbar.component';
import { TableComponent } from '../../../shared/table/table.component';
import { tableColumns } from './contactos-table.config';
import { ContactosEmpresa } from '../../../models/contactos-empresa.model';
import { ConfirmationModalComponent, ConfirmMode } from '../../../shared/confirmation-modal/confirmation-modal.component';
import { ContactosEmpresasApiService } from '../../../services/contactos-empresas-api.service';
import { ToastService } from '../../../services/toast.service';
import { ContactosModalComponent } from '../components/contactos-modal/contactos-modal.component';

@Component({
  selector: 'app-contactos-empresas-page',
  standalone: true,
  imports: [CommonModule, 
    TopbarComponent,
    StatsRowComponent,
    ToolbarComponent,
    TableComponent,
    ConfirmationModalComponent,
    ContactosModalComponent
  ],
  templateUrl: './contactos-empresas-page.component.html',
})
export class ContactosEmpresasPageComponent {
  api = inject(ContactosEmpresasApiService);
  toast = inject(ToastService);
  ConfirmMode = ConfirmMode;
  
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly _contactos = signal<ContactosEmpresa[]>([]);
  private readonly _total = signal(10);
  private readonly _totalActivos = signal(0);
  private readonly _totalInactivos = signal(0);

  readonly contactos = this._contactos.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalActivos = this._totalActivos.asReadonly();
  readonly totalInactivos = this._totalInactivos.asReadonly();

  nombreEmpresa = '';
  tableColumns = tableColumns;
  

  // ── Filtros ──────────────────────────────────────
  searchQuery  = '';
  activeFilter: ContactoFilterType = '';
  cargoFilter: ContactoFilterCargoType = ''
  currentPage = signal(1);
  readonly PAGE_SIZE = 10;

  // ── Estado modales ────────────────────────────────
  showAdd = false;
  showEdit = false;
  showBaja = false;
  selectedId: number | null = null;

  // ── Computed ──────────────────────────────────────
  get empresaId(): number | null {
    return this.route.snapshot.paramMap.get('id') ? Number(this.route.snapshot.paramMap.get('id')) : null;
  }

  get selectedContacto(): ContactosEmpresa | null {
    if (this.selectedId === null) return null;
    return this.getById(this.selectedId) ?? null;
  }

  // ── Handlers ──────────────────────────────────────
  goToEmpresas(): void {
    this.router.navigate(['/empresas']);
  }

  onTableAction(event: { type: string; id: number }): void {
    switch (event.type) {
      case 'edit': this.onEditClick(event.id); break;
      case 'baja': this.onBajaClick(event.id); break;
      case 'activar': this.onBajaClick(event.id); break;
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    // this.loadAll(this.searchQuery, this.activeFilter, this.typeFilter);
  }

  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage.set(1);
    // this.loadAll(q, this.activeFilter, this.typeFilter);
  }
  
  onFilterChange(f: ContactoFilterType): void {
    this.activeFilter = f;
    this.currentPage.set(1);
    // this.loadAll(this.searchQuery, f, this.typeFilter);
  }

  onCargoFilterChange(c: ContactoFilterCargoType): void {
    this.cargoFilter = c;
    this.currentPage.set(1);
    // this.loadAll(this.searchQuery, this.activeFilter, c);
  }

  openAdd(): void {
    this.showAdd = true;
  }

  onSaveAdd(data: Omit<ContactosEmpresa, 'id'>): void {
    this.api.create({ ...data }).subscribe({
      next: (created) => {
        this._contactos.set([...this.contactos(), created]);
        this.showAdd = false;
        this.toast.show('success', `✓ Contacto <strong>${data.nombre} ${data.primer_apellido}</strong> añadido correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo añadir el contacto. Inténtalo de nuevo.'),
    });
  }

  onEditClick(id: number): void {
    this.selectedId = id;
    this.showEdit = true;
  }

  onSaveEdit(data: ContactosEmpresa): void {
    this.api.update(data.id!, data).subscribe({
      next: (updated) => {
        this._contactos.update(list => list.map(c => c.id === data.id ? updated : c));
        this.showEdit = false;
        this.selectedId = null;
        this.toast.show('info', `✎ Contacto <strong>${data.nombre} ${data.primer_apellido}</strong> actualizado correctamente`);
      },
      error: () => this.toast.show('error', '✗ No se pudo actualizar el contacto. Inténtalo de nuevo.'),
    });
  }

  onBajaClick(id: number): void {
    this.selectedId = id;
    this.showBaja = true;
  }

  onConfirmBaja(): void {
    if (this.selectedId == null) return;
    const e = this.getById(this.selectedId)!;
    const wasActive = e.activo;
    this.api.toggleStatus(this.selectedId).subscribe({
      next: (updated) => {
        this._contactos.update(list => list.map(item => item.id === this.selectedId ? updated : item));
        this.showBaja = false;
        this.selectedId = null;
        if (wasActive) {
          this.toast.show('warning', `⊘ Contacto dado de baja`);
        } else {
          this.toast.show('success', `↺ Contacto reactivado`);
        }
      },
      error: () => this.toast.show('error', '✗ No se pudo cambiar el estado del contacto. Inténtalo de nuevo.'),
    });
  }

  getById(id: number): ContactosEmpresa | undefined {
    return this._contactos().find(c => c.id === id);
  }
}