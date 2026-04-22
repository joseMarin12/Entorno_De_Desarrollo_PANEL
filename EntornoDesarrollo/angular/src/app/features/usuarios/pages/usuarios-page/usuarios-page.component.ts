import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsuariosService } from '../../../../services/usuarios.service';
import { ToastService } from '../../../../services/toast.service';
import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { Usuario } from '../../../../models/usuarios.model';
import { Comercial } from '../../../../models/comercial.model';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
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
})
export class UsuariosPageComponent implements OnInit {
    svc = inject(UsuariosService);
    toast = inject(ToastService);
    comercialesSvc = inject(ComercialesApiService);
    ConfirmMode = ConfirmMode;
    private readonly _comercialesEmails = signal<string[]>([]);

    // ── Filtros ──────────────────────────────────────
    searchQuery = '';
    activeFilter: UsuariosFilterType = 'todos';
    currentPage = 1;
    readonly PAGE_SIZE = 10;

    // ── Estado modales ────────────────────────────────
    showAdd = false;
    showEdit = false;
    showBaja = false;
    showDetail = false;
    selectedId: number | null = null;

    // ── Ciclo de vida ─────────────────────────────────
    ngOnInit(): void {
        this.loadPage();
        this.loadComercialesEmails();
    }

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

    get selectedUsuario(): Usuario | null {
        if (this.selectedId == null) {
            return null;
        }
        return this.svc.getById(this.selectedId) ?? null;
    }

    // ── Validación de Emails ──────────────────────────
    readonly emailUsuarios = computed(() => {
        const fromUsers = this.svc.usuarios().map(u => u.email.toLowerCase());
        const fromComerciales = this._comercialesEmails();
        return Array.from(new Set([...fromUsers, ...fromComerciales]));
    });

    // ── Handlers ──────────────────────────────────────
    onSearchChange(query: string): void {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadPage();
    }

    onFilterChange(filter: UsuariosFilterType): void {
        this.activeFilter = filter;
        this.currentPage = 1;
        this.loadPage();
    }

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

    async onConfirmBaja(): Promise<void> {
        if (this.selectedId == null) return;
        const u = this.svc.getById(this.selectedId)!;
        const wasActive = u.enabled;
        try {
            await this.svc.toggleActivo(this.selectedId);
            this.showBaja = false;
            this.selectedId = null;
            if (wasActive) {
                this.toast.show('warning', `⊘ Usuario <strong>${this.svc.fullName(u)}</strong> dado de baja`);
            } else {
                this.toast.show('success', `↺ Usuario <strong>${this.svc.fullName(u)}</strong> reactivado`);
            }
        } catch {
            this.toast.show('error', `✗ No se pudo cambiar el estado. Inténtalo de nuevo.`);
        }
    }
}
