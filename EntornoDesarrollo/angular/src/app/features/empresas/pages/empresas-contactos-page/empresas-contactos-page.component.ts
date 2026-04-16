import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-empresas-contactos-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas-contactos-page.component.html',
})
export class EmpresasContactosPageComponent {
  private readonly route = inject(ActivatedRoute);

  get empresaId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }
}