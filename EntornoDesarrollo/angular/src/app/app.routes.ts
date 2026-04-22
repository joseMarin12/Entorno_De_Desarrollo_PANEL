import { Routes } from '@angular/router';
import { ComercialesPageComponent } from './features/comerciales/pages/comerciales-page/comerciales-page.component';
import { SeleccionadoresPageComponent } from './features/seleccionadores/pages/seleccionadores-page/seleccionadores-page.component';
import { EmpresasPageComponent } from './features/empresas/pages/empresas-page/empresas-page.component';
import { EmpresasDireccionesPageComponent } from './features/empresas/pages/empresas-direcciones-page/empresas-direcciones-page.component';
import { EmpresasContactosPageComponent } from './features/empresas/pages/empresas-contactos-page/empresas-contactos-page.component';
import { UsuariosPageComponent } from './features/usuarios/pages/usuarios-page/usuarios-page.component';
import { FormacionesPageComponent } from './features/formaciones/pages/formaciones-page/formaciones-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'comerciales', pathMatch: 'full' },
  { path: 'comerciales', component: ComercialesPageComponent },
  { path: 'seleccionadores', component: SeleccionadoresPageComponent },
  { path: 'empresas/:id/direcciones', component: EmpresasDireccionesPageComponent },
  { path: 'empresas/:id/contactos', component: EmpresasContactosPageComponent },
  { path: 'empresas', component: EmpresasPageComponent },
  { path: 'usuarios', component: UsuariosPageComponent },
  { path: 'formaciones', component: FormacionesPageComponent },
  // Añade aquí el resto de rutas cuando crees las otras páginas:
  // { path: 'empresas',        component: EmpresasPageComponent },
];
