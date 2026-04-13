import { Routes } from '@angular/router';
import { ComercialesPageComponent } from './features/comerciales/pages/comerciales-page/comerciales-page.component';
import { SeleccionadoresPageComponent } from './features/seleccionadores/pages/seleccionadores-page/seleccionadores-page.component';
import { UsuariosPageComponent } from './features/usuarios/pages/usuarios-page/usuarios-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'comerciales', pathMatch: 'full' },
  { path: 'comerciales', component: ComercialesPageComponent },
  { path: 'seleccionadores', component: SeleccionadoresPageComponent },
<<<<<<< HEAD
  { path: 'usuarios', component: UsuariosPageComponent },
  // Añade aquí el resto de rutas cuando crees las otras páginas:
  // { path: 'empresas',        component: EmpresasPageComponent },
=======

>>>>>>> d7a4ca270f62821d68c0179c322fb6ef937d64e8
];
