import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { ConfirmationModalComponent, ConfirmMode } from '../../../../shared/confirmation-modal/confirmation-modal.component';
import { ContactosEmpresasApiService } from '../../../../services/contactos-empresas-api.service';
import { ToastService } from '../../../../services/toast.service';
import { ContactoEmpresa } from '../../../../models/contacto-empresa.model';
import { ContactosStatsRowComponent } from '../../components/stats-row/stats-row.component';
import { ContactosToolbarComponent, ContactoFilterType } from '../../components/toolbar/toolbar.component';
import { ContactosModalComponent } from '../../components/contactos-modal/contactos-modal.component';

@Component({
  selector: 'app-contactos-empresas-page',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    ContactosStatsRowComponent,
    ContactosToolbarComponent,
    ContactosModalComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './contactos-empresas-page.component.html',
})
export class ContactosEmpresasPageComponent implements OnInit {
  private readonly api = inject(ContactosEmpresasApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  ConfirmMode = ConfirmMode;

  private readonly _contactos = signal<ContactoEmpresa[]>([]);
  private readonly _total = signal(0);
  private readonly _totalActivos = signal(0);
  private readonly _totalInactivos = signal(0);
  readonly contactos = this._contactos.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalActivos = this._totalActivos.asReadonly();
  readonly totalInactivos = this._totalInactivos.asReadonly();

  searchQuery = '';
  activeFilter: ContactoFilterType = '';
  currentPage = signal(1);
  totalFiltered = signal(0);
  readonly PAGE_SIZE = 10;

  nombreEmpresa = '';
  showForm = false;
  showBaja = false;
  selectedId = signal<number | null>(null);

  readonly selectedContacto = computed<ContactoEmpresa | null>(() => {
    const id = this.selectedId();
    return id != null ? (this._contactos().find(c => c.id === id) ?? null) : null;
  });

  get empresaId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.nombreEmpresa = history.state?.nombreEmpresa ?? '';
    this.loadAll();
  }

  private loadAll(): void {
    this.api.findAll(this.empresaId, { searchText: this.searchQuery, status: this.activeFilter }, this.currentPage(), this.PAGE_SIZE).subscribe({
      next: (res) => {
        this._contactos.set(res.data ?? []);
        this._total.set(res.total ?? 0);
        this._totalActivos.set(res.totalActivos ?? 0);
        this._totalInactivos.set(res.totalInactivos ?? 0);
        this.totalFiltered.set(res.total ?? 0);
      },
      error: () => this.toast.show('error', '✗ No se pudo cargar los contactos. Inténtalo de nuevo.'),
    });
  }

  onSearchChange(q: string): void {
    this.searchQuery = q;
    this.currentPage.set(1);
    this.loadAll();
  }

  onFilterChange(f: ContactoFilterType): void {
    this.activeFilter = f;
    this.currentPage.set(1);
    this.loadAll();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAll();
  }

  openAdd(): void {
    this.selectedId.set(null);
    this.showForm = true;
  }

  onEditClick(id: number): void {
    this.selectedId.set(id);
    this.showForm = true;
  }

  onBajaClick(id: number): void {
    this.selectedId.set(id);
    this.showBaja = true;
  }

  onSaveForm(data: Omit<ContactoEmpresa, 'id' | 'created_at'>): void {
    const id = this.selectedId();
    if (id) {
      this.api.update(id, data).subscribe({
        next: () => {
          this.showForm = false;
          this.selectedId.set(null);
          this.loadAll();
          this.toast.show('info', `✎ Contacto <strong>${data.nombre} ${data.primer_apellido}</strong> actualizado`);
        },
        error: () => this.toast.show('error', '✗ No se pudo guardar los cambios. Inténtalo de nuevo.'),
      });
    } else {
      this.api.create(data).subscribe({
        next: () => {
          this.showForm = false;
          this.loadAll();
          this.toast.show('success', `✓ Contacto <strong>${data.nombre} ${data.primer_apellido}</strong> añadido correctamente`);
        },
        error: () => this.toast.show('error', '✗ No se pudo añadir el contacto. Inténtalo de nuevo.'),
      });
    }
  }

  onConfirmBaja(): void {
    const id = this.selectedId();
    if (id == null) return;
    const c = this.selectedContacto()!;
    const wasActive = c.activo;
    this.api.toggleStatus(id).subscribe({
      next: () => {
        this.showBaja = false;
        this.selectedId.set(null);
        this.loadAll();
        if (wasActive) {
          this.toast.show('warning', `⊘ Contacto <strong>${c.nombre} ${c.primer_apellido}</strong> dado de baja`);
        } else {
          this.toast.show('success', `↺ Contacto <strong>${c.nombre} ${c.primer_apellido}</strong> reactivado`);
        }
      },
      error: () => this.toast.show('error', '✗ No se pudo cambiar el estado. Inténtalo de nuevo.'),
    });
  }

  goToEmpresas(): void {
    this.router.navigate(['/empresas']);
  }
}
