import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { Usuario } from '../../../../models/usuarios.model';
import { UsuariosService } from '../../../../services/usuarios.service';
import { ToastService } from '../../../../services/toast.service';
import { UsuariosStatsRowComponent } from '../../components/stats-row/usuarios-stats-row.component';
import { UsuariosToolbarComponent, UsuariosFilterType } from '../../components/toolbar/usuarios-toolbar.component';
import { UsuariosTableComponent } from '../../components/usuarios-table/usuarios-table.component';
import { UsuariosModalDetailComponent } from '../../components/modal-detail/usuarios-modal-detail.component';
import { UsuariosModalFormComponent } from '../../components/modal-form/modal-form.component';
import { ConfirmationModalComponent, ConfirmMode } from "../../../../shared/confirmation-modal/confirmation-modal.component";
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-usuarios-page',
    standalone: true,
    imports: [
        CommonModule,
        TopbarComponent,
        UsuariosStatsRowComponent,
        UsuariosToolbarComponent,
        UsuariosTableComponent,
        UsuariosModalFormComponent,
        UsuariosModalDetailComponent,
        ConfirmationModalComponent
    ],
    templateUrl: './usuarios-page.component.html',
    styles: [`
        .page-container { padding: 32px; max-width: 1600px; margin: 0 auto; }
        .page-header { margin-bottom: 32px; }
        .page-title { font-size: 24px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; margin-bottom: 8px; }
        .page-subtitle { color: var(--text-muted); font-size: 14px; font-weight: 500; }
    `]
})
export class UsuariosPageComponent implements OnInit {
    svc = inject(UsuariosService);
    toast = inject(ToastService);

    // ── Estado ────────────────────────────────────────
    currentPage = 1;
    readonly PAGE_SIZE = 10;

    // ── Estado modales ────────────────────────────────
    showForm = false;
    showBaja = false;
    showDetail = false;
    selectedId = signal<number | null>(null);

    // ── Filtros ───────────────────────────────────────
    searchQuery = '';
    activeFilter: UsuariosFilterType = 'todos';

    // ── Datos calculados ──────────────────────────────
    selectedUsuario = computed(() => 
        this.selectedId() ? this.svc.getById(this.selectedId()!) : null
    );

    emailUsuarios = computed(() => 
        this.svc.usuarios().map(u => (u.email || '').toLowerCase())
    );

    // ── Ciclo de vida ─────────────────────────────────
    ngOnInit(): void {
        this.svc.loadRoles();
        this.loadPage();
    }

    // ── Lógica de carga ───────────────────────────────
    private loadPage(): void {
        let status: boolean | '' = '';
        if (this.activeFilter === 'activos') {
            status = true;
        } else if (this.activeFilter === 'inactivos') {
            status = false;
        }
        const filters = {
            searchText: this.searchQuery,
            status,
        };
        this.svc.loadAll(this.currentPage, this.PAGE_SIZE, filters).subscribe();
    }


    // ── Eventos Toolbar ───────────────────────────────
    onSearch(query: string): void {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadPage();
    }

    onFilterChange(filter: UsuariosFilterType): void {
        this.activeFilter = filter;
        this.currentPage = 1;
        this.loadPage();
    }

    onCsvImported(): void {
        this.loadPage();
    }

    // ── Acciones Tabla ────────────────────────────────
    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadPage();
    }

    openAdd(): void {
        this.selectedId.set(null);
        this.showForm = true;
    }

    onSaveForm(data: Partial<Usuario>): void {
        if (this.selectedId()) {
            this.svc.update(this.selectedId()!, data as Usuario).subscribe({
                next: () => {
                    this.showForm = false;
                    this.selectedId.set(null);
                    this.toast.show('info', `✎ Usuario <strong>${data.nombre} ${data.apellido1}</strong> actualizado`);
                },
                error: (err: any) => {
                    const msg = err?.message?.toLowerCase().includes('duplicate') || err?.message?.toLowerCase().includes('ya existe') 
                        ? '✗ El email ya está registrado.' 
                        : '✗ No se pudo guardar los cambios. Inténtalo de nuevo.';
                    this.toast.show('error', msg);
                }
            });
        } else {
            this.svc.add(data as Omit<Usuario, 'id'>).subscribe({
                next: () => {
                    this.showForm = false;
                    this.toast.show('success', `✓ Usuario <strong>${data.nombre} ${data.apellido1}</strong> añadido correctamente`);
                },
                error: (err: any) => {
                    const msg = err?.message?.toLowerCase().includes('duplicate') || err?.message?.toLowerCase().includes('ya existe') 
                        ? '✗ El email ya está registrado.' 
                        : '✗ No se pudo añadir el usuario. Inténtalo de nuevo.';
                    this.toast.show('error', msg);
                }
            });
        }
    }

    onDetailClick(id: number): void {
        this.selectedId.set(id);
        this.showDetail = true;
    }

    onEditClick(id: number): void {
        this.selectedId.set(id);
        this.showForm = true;
    }

    onBajaClick(id: number): void {
        this.selectedId.set(id);
        this.showBaja = true;
    }

    onConfirmBaja(): void {
        const id = this.selectedId();
        if (id == null) return;
        const u = this.svc.getById(id)!;
        const wasActive = u.enabled;
        this.svc.toggleActivo(id).subscribe({
            next: () => {
                this.showBaja = false;
                this.selectedId.set(null);
                if (wasActive) {
                    this.toast.show('warning', `⊘ Usuario <strong>${this.svc.fullName(u)}</strong> dado de baja`);
                } else {
                    this.toast.show('success', `↺ Usuario <strong>${this.svc.fullName(u)}</strong> reactivado`);
                }
            },
            error: () => {
                this.toast.show('error', `✗ No se pudo cambiar el estado. Inténtalo de nuevo.`);
            }
        });
    }

    get ConfirmMode() { return ConfirmMode; }
}
