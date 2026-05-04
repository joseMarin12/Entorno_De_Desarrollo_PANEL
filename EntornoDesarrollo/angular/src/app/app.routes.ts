import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/login/pages/login-page/login-page.component';
import { ChangePasswordComponent } from './features/login/pages/change-password/change-password.component';
import { ComercialesPageComponent } from './features/comerciales/pages/comerciales-page/comerciales-page.component';
import { SeleccionadoresPageComponent } from './features/seleccionadores/pages/seleccionadores-page/seleccionadores-page.component';
import { EmpresasPageComponent } from './features/empresas/pages/empresas-page/empresas-page.component';
import { EmpresasDireccionesPageComponent } from './features/empresas/pages/empresas-direcciones-page/empresas-direcciones-page.component';
import { EmpresasContactosPageComponent } from './features/empresas/pages/empresas-contactos-page/empresas-contactos-page.component';
import { UsuariosPageComponent } from './features/usuarios/pages/usuarios-page/usuarios-page.component';
import { FormacionesPageComponent } from './features/formaciones/pages/formaciones-page/formaciones-page.component';
import { autenticadorGuard } from './guards/autenticador.guard';
import { firstLoginGuard } from './guards/first-login.guard';
import { AsignacionesPageComponent } from './features/asignaciones/pages/asignaciones-page/asignaciones-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { 
    path: 'change-password', 
    component: ChangePasswordComponent, 
    canActivate: [autenticadorGuard, firstLoginGuard] 
  },
  { 
    path: '', 
    canActivate: [autenticadorGuard, firstLoginGuard],
    children: [
      { path: 'comerciales', component: ComercialesPageComponent },
      { path: 'seleccionadores', component: SeleccionadoresPageComponent },
      { path: 'empresas/:id/direcciones', component: EmpresasDireccionesPageComponent },
      { path: 'empresas/:id/contactos', component: EmpresasContactosPageComponent },
      { path: 'empresas', component: EmpresasPageComponent },
      { path: 'usuarios', component: UsuariosPageComponent },
      { path: 'formaciones', component: FormacionesPageComponent },
    ]
  }
];
