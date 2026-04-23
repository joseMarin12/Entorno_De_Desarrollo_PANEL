import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { Usuario } from '../../../../models/usuarios.model';
import { UsuariosService } from '../../../../services/usuarios.service';
import { ToastService } from '../../../../services/toast.service';
import { UsuariosStatsRowComponent } from '../../components/stats-row/usuarios-stats-row.component';
import { UsuariosToolbarComponent, UsuariosFilterType } from '../../components/toolbar/usuarios-toolbar.component';
import { UsuariosTableComponent } from '../../components/usuarios-table/usuarios-table.component';
import { UsuariosModalAddComponent } from '../../components/modal-add/modal-add.component';
import { UsuariosModalEditComponent } from '../../components/modal-edit/modal-edit.component';
import { UsuariosModalDetailComponent } from '../../components/modal-detail/usuarios-modal-detail.component';
import { ConfirmationModalComponent, ConfirmMode } from "../../../../shared/confirmation-modal/confirmation-modal.component";

@Component({
    selector: 'app-usuarios-page',
    standalone: true,
    imports: [
    CommonModule,
    TopbarComponent,
    UsuariosStatsRowComponent,
    UsuariosToolbarComponent,
    UsuariosTableComponent,
    UsuariosModalAddComponent,
    UsuariosModalEditComponent,
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
    showAdd = false;
    showEdit = false;
    showBaja = false;
    showDetail = false;
    selectedId: number | null = null;

    // ── Filtros ───────────────────────────────────────
    searchQuery = '';
    activeFilter: UsuariosFilterType = 'todos';

    // ── Datos calculados ──────────────────────────────
    selectedUsuario = computed(() => 
        this.selectedId ? this.svc.getById(this.selectedId) : null
    );

    emailUsuarios = signal<string[]>([]);

    // ── Ciclo de vida ─────────────────────────────────
    ngOnInit(): void {
        this.loadPage();
        this.loadComercialesEmails();
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
        this.svc.loadAll(this.currentPage, this.PAGE_SIZE, filters);
    }

    private loadComercialesEmails(): void {
        this.svc.http.get<any>(`${environment.apiUrl}/comerciales`).subscribe({
            next: (res) => {
                const emails = (res.data || []).map((c: any) => c.email).filter(Boolean);
                this.emailUsuarios.set(emails);
            }
        });
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

    // ── Acciones Tabla ────────────────────────────────
    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadPage();
    }

    openAdd(): void {
        this.showAdd = true;
    }

    async onSaveAdd(data: Omit<Usuario, 'id'>): Promise<void> {
        try {
            await this.svc.add(data);
            this.showAdd = false;
            this.toast.show('success', `✓ Usuario <strong>${data.nombre} ${data.apellido1}</strong> añadido correctamente`);
        } catch {
            this.toast.show('error', `✗ No se pudo añadir el usuario. Inténtalo de nuevo.`);
        }
    }

    onDetailClick(id: number): void {
        this.selectedId = id;
        this.showDetail = true;
    }

    onEditClick(id: number): void {
        this.selectedId = id;
        this.showEdit = true;
    }

    async onSaveEdit(data: Usuario): Promise<void> {
        try {
            await this.svc.update(data.id, data);
            this.showEdit = false;
            this.selectedId = null;
            this.toast.show('info', `✎ Usuario <strong>${data.nombre} ${data.apellido1}</strong> actualizado`);
        } catch {
            this.toast.show('error', `✗ No se pudo guardar los cambios. Inténtalo de nuevo.`);
        }
    }

    onBajaClick(id: number): void {
        this.selectedId = id;
        this.showBaja = true;
    }

    onConfirmBaja(): void {
        if (this.selectedId == null) return;
        const u = this.svc.getById(this.selectedId)!;
        const wasActive = u.enabled;
        this.svc.toggleActivo(this.selectedId).subscribe({
            next: () => {
                this.showBaja = false;
                this.selectedId = null;
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

import { environment } from '../../../../environments/environment';
