import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresasApiService } from '../../../../services/empresas-api.service';

@Component({
  selector: 'app-empresas-direcciones-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas-direcciones-page.component.html',
})
export class EmpresasDireccionesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(EmpresasApiService);

  empresaId: string | null = null;
  nombreEmpresa = signal<string>('Cargando...');
  direcciones = signal<any[]>([]);
  cargando = signal<boolean>(true);

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.paramMap.get('id');
    // Intentamos recuperar el nombre si vino por el router state (como vi en tu código anterior)
    const state = history.state;
    if (state && state.nombreEmpresa) {
      this.nombreEmpresa.set(state.nombreEmpresa);
    }

    if (this.empresaId) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    this.api.findAll('', '', '', 1, 1000).subscribe({
      next: (res: any) => {
        const empresas = res.data ?? [];
        const empresaEncontrada = empresas.find((e: any) => String(e.id) === String(this.empresaId));
        
        if (empresaEncontrada) {
          if (this.nombreEmpresa() === 'Cargando...') {
            this.nombreEmpresa.set([empresaEncontrada.nombre, empresaEncontrada.razonSocial].filter(Boolean).join(' '));
          }
          this.direcciones.set(empresaEncontrada.direccionesData || []);
        } else {
          this.nombreEmpresa.set('Empresa no encontrada');
        }
        this.cargando.set(false);
      },
      error: () => {
        this.nombreEmpresa.set('Error al cargar');
        this.cargando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/empresas']);
  }
}