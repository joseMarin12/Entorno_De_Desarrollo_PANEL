import { Routes } from '@angular/router';
import { ComercialesPageComponent } from './features/comerciales/pages/comerciales-page/comerciales-page.component';

export const routes: Routes = [
  { path: '',           redirectTo: 'comerciales', pathMatch: 'full' },
  { path: 'comerciales', component: ComercialesPageComponent },
  // Añade aquí el resto de rutas cuando crees las otras páginas:
  // { path: 'usuarios',        component: UsuariosPageComponent },
  // { path: 'empresas',        component: EmpresasPageComponent },
];
