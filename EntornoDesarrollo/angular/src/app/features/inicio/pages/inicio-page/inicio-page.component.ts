import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AutenticadorService } from '../../../../services/autenticador.service';
import { TrabajadoresApiService, TrabajadorStats } from '../../../../services/trabajadores-api.service';
import { FormacionesService } from '../../../../services/formaciones.service';
import { ComercialesApiService, ComercialStats } from '../../../../services/comerciales-api.service';
import { SeleccionadoresApiService, SeleccionadorStats } from '../../../../services/seleccionadores-api.service';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';
import { Trabajador, getFullName, getInitials, getColorFor } from '../../../../models/trabajador.model';
import { Formacion } from '../../../../models/formacion.model';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent],
  templateUrl: './inicio-page.component.html',
  styleUrls: ['./inicio-page.component.scss']
})
export class InicioPageComponent implements OnInit, OnDestroy {
  auth = inject(AutenticadorService);
  trabajadoresSvc = inject(TrabajadoresApiService);
  formacionesSvc = inject(FormacionesService);
  comercialesSvc = inject(ComercialesApiService);
  seleccionadoresSvc = inject(SeleccionadoresApiService);
  empresasSvc = inject(EmpresasApiService);

  // Reloj en tiempo real
  currentTime = signal<string>('');
  currentDate = signal<string>('');
  private timerId: any;

  // Estadísticas locales de los servicios
  trabajadorStats = signal<TrabajadorStats>({ total: 0, activos: 0, inactivos: 0, freelances: 0 });
  comercialStats = signal<ComercialStats>({ total: 0, activos: 0, inactivos: 0 });
  seleccionadorStats = signal<SeleccionadorStats>({ total: 0, activos: 0, inactivos: 0, externos: 0 });
  empresaStats = signal<{ total: number; totalActivos: number; totalInactivos: number }>({ total: 0, totalActivos: 0, totalInactivos: 0 });

  loading = signal<boolean>(true);

  // Listados recientes para llenar el Dashboard
  recentTrabajadores = signal<Trabajador[]>([]);
  recentFormaciones = computed(() => {
    return this.formacionesSvc.formaciones().slice(0, 4);
  });

  // Helpers expuestos al template
  getFullName = getFullName;
  getInitials = getInitials;
  getColorFor = getColorFor;

  // Computes para porcentajes de actividad
  trabajadoresActivosPct = computed(() => {
    const stats = this.trabajadorStats();
    return stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
  });

  formacionesActivasPct = computed(() => {
    const total = this.formacionesSvc.total();
    const activas = this.formacionesSvc.totalActivos();
    return total > 0 ? Math.round((activas / total) * 100) : 0;
  });

  empresasActivasPct = computed(() => {
    const stats = this.empresaStats();
    return stats.total > 0 ? Math.round((stats.totalActivos / stats.total) * 100) : 0;
  });

  comercialesActivosPct = computed(() => {
    const stats = this.comercialStats();
    return stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
  });

  seleccionadoresActivosPct = computed(() => {
    const stats = this.seleccionadorStats();
    return stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
  });

  get userDisplayName(): string {
    const user = this.auth.currentUser();
    if (!user) return 'Usuario';

    const rawUser = user as any;
    return rawUser.name || rawUser.nombre || user.email || 'Usuario';
  }

  get userRole(): string {
    const roleId = this.auth.currentUser()?.roleid;
    if (roleId === 1) return 'Usuario';
    if (roleId === 2) return 'Administrador';
    return 'Invitado';
  }

  ngOnInit(): void {
    this.updateClock();
    this.timerId = setInterval(() => this.updateClock(), 1000);
    this.loadAllStatistics();
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // Capitalizar la primera letra del día de la semana y mes
    const rawDate = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
    this.currentDate.set(formattedDate);
  }

  loadAllStatistics(): void {
    this.loading.set(true);

    // Ejecutar llamadas en paralelo/secuencia para cargar estadísticas
    let completedCount = 0;
    const checkComplete = () => {
      completedCount++;
      if (completedCount === 5) {
        this.loading.set(false);
      }
    };

    // Solicitamos 4 trabajadores para mostrar en el listado reciente
    this.trabajadoresSvc.findAll(1, 4).subscribe({
      next: page => {
        this.trabajadorStats.set(page.stats);
        this.recentTrabajadores.set(page.data);
        checkComplete();
      },
      error: () => checkComplete()
    });

    this.comercialesSvc.findAll(1, 1).subscribe({
      next: page => {
        this.comercialStats.set(page.stats);
        checkComplete();
      },
      error: () => checkComplete()
    });

    this.seleccionadoresSvc.findAll(1, 1).subscribe({
      next: page => {
        this.seleccionadorStats.set(page.stats);
        checkComplete();
      },
      error: () => checkComplete()
    });

    this.empresasSvc.findAll('', '', '', 1, 1).subscribe({
      next: res => {
        this.empresaStats.set({
          total: res.total,
          totalActivos: res.totalActivos,
          totalInactivos: res.totalInactivos
        });
        checkComplete();
      },
      error: () => checkComplete()
    });

    // Solicitamos 4 formaciones para el listado reciente
    this.formacionesSvc.loadAll('', '', 'todos', 1, 4).subscribe({
      next: () => checkComplete(),
      error: () => checkComplete()
    });
  }
}
