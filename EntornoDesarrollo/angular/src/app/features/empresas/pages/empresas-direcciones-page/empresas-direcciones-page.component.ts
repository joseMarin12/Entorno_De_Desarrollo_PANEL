import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-empresas-direcciones-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas-direcciones-page.component.html',
})
export class EmpresasDireccionesPageComponent {
  private readonly route = inject(ActivatedRoute);

  get empresaId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }
}
