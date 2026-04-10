import { Routes } from '@angular/router';
import { ComercialesPageComponent } from './features/comerciales/pages/comerciales-page/comerciales-page.component';
import { SeleccionadoresPageComponent } from './features/seleccionadores/pages/seleccionadores-page/seleccionadores-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'comerciales', pathMatch: 'full' },
  { path: 'comerciales', component: ComercialesPageComponent },
  { path: 'seleccionadores', component: SeleccionadoresPageComponent },

];
