import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiService } from '../../services/ui.service';
import { AutenticadorService } from '../../services/autenticador.service';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  ui = inject(UiService);
  auth = inject(AutenticadorService);

  gestionItems: NavItem[] = [
    { label: 'Usuarios',        route: '/usuarios',        icon: 'user' },
    { label: 'Seleccionadores', route: '/seleccionadores', icon: 'grid' },
    { label: 'Comerciales',     route: '/comerciales',     icon: 'team' },
    { label: 'Empresas',        route: '/empresas',        icon: 'briefcase' },
    { label: 'Correos Internos',route: '/correos',         icon: 'mail' },
  ];

  trabajadoresItems: NavItem[] = [
    { label: 'Trabajadores', route: '/trabajadores', icon: 'user' },
    { label: 'HeadHunting',  route: '/headhunting',  icon: 'star' },
    { label: 'Asignaciones', route: '/asignaciones', icon: 'link' },
    { label: 'Facturaciones',route: '/facturaciones', icon: 'file' },
    { label: 'Comisiones',   route: '/comisiones',   icon: 'chart' },
    { label: 'Informes',     route: '/informes',     icon: 'table' },
  ];
}
