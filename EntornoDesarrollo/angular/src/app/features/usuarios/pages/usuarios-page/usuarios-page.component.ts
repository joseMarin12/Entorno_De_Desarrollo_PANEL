import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsuariosService } from '../../../../services/usuarios.service';
import { ToastService } from '../../../../services/toast.service';
import { Usuario } from '../../../../models/usuarios.model';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { UsuariosStatsRowComponent } from '../../components/stats-row/usuarios-stats-row.component';
import { UsuariosToolbarComponent, UsuariosFilterType } from '../../components/toolbar/usuarios-toolbar.component';
import { UsuariosTableComponent } from '../../components/usuarios-table/usuarios-table.component';
import { UsuariosModalAddComponent } from '../../components/modal-add/modal-add.component';
import { UsuariosModalEditComponent } from '../../components/modal-edit/modal-edit.component';
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
    ConfirmationModalComponent
],
    templateUrl: './usuarios-page.component.html',
})
export class UsuariosPageComponent {
    svc = inject(UsuariosService);
    toast = inject(ToastService);
    ConfirmMode = ConfirmMode;

    // ── Filtros ──────────────────────────────────────
    searchQuery = '';
    activeFilter: UsuariosFilterType = 'todos';
    currentPage = 1;
    readonly PAGE_SIZE = 10;

    // ── Estado modales ────────────────────────────────
    showAdd = false;
    showEdit = false;
    showBaja = false;
    selectedId: number | null = null;

    // ── Computed ──────────────────────────────────────
    get filtered(): Usuario[] {
        const q = this.searchQuery.toLowerCase().trim();
        return this.svc.usuarios().filter((u) => {
            const matchesFilter =
                this.activeFilter === 'todos' ? true :
                    this.activeFilter === 'activos' ? u.enabled : !u.enabled;
            const matchesSearch =
                !q ||
                this.svc.fullName(u).toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });
    }

    get paginatedUsuarios(): Usuario[] {
        const start = (this.currentPage - 1) * this.PAGE_SIZE;
        return this.filtered.slice(start, start + this.PAGE_SIZE);
    }

    get selectedUsuario(): Usuario | null {
        return this.selectedId != null ? (this.svc.getById(this.selectedId) ?? null) : null;
    }

    // ── Handlers ──────────────────────────────────────
    onSearchChange(query: string): void {
        this.searchQuery = query;
        this.currentPage = 1;
    }

    onFilterChange(filter: UsuariosFilterType): void {
        this.activeFilter = filter;
        this.currentPage = 1;
    }

    openAdd(): void {
        this.showAdd = true;
    }

    onSaveAdd(data: Omit<Usuario, 'id'>): void {
        this.svc.add(data);
        this.showAdd = false;
        this.toast.show('success', `✓ Usuario <strong>${data.nombre} ${data.apellido1}</strong> añadido correctamente`);
    }

    onEditClick(id: number): void {
        this.selectedId = id;
        this.showEdit = true;
    }

    onSaveEdit(data: Usuario): void {
        this.svc.update(data.id, data);
        this.showEdit = false;
        this.selectedId = null;
        this.toast.show('info', `✎ Usuario <strong>${data.nombre} ${data.apellido1}</strong> actualizado`);
    }

    onBajaClick(id: number): void {
        this.selectedId = id;
        this.showBaja = true;
    }

    onConfirmBaja(): void {
        if (this.selectedId == null) return;
        const u = this.svc.getById(this.selectedId)!;
        const wasActive = u.enabled;
        this.svc.toggleActivo(this.selectedId);
        this.showBaja = false;
        this.selectedId = null;
        if (wasActive) {
            this.toast.show('warning', `⊘ Usuario <strong>${this.svc.fullName(u)}</strong> dado de baja`);
        } else {
            this.toast.show('success', `↺ Usuario <strong>${this.svc.fullName(u)}</strong> reactivado`);
        }
    }
}
