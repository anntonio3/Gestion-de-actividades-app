import { Routes } from '@angular/router';
import { CalendarioComponent } from './features/calendario_actividades/calendario.component';

export const routes: Routes = [
  { path: '',          redirectTo: 'calendario', pathMatch: 'full' },

  { path: 'calendario', component: CalendarioComponent },
  {
    path: 'actividades/registrar',
    loadComponent: () =>
      import('./features/actividades/registrar-actividad/registrar-actividad.component')
        .then(m => m.RegistrarActividadComponent)
  },
  {
    path: 'mis-publicaciones',
    loadComponent: () =>
      import('./features/actividades/mis-solicitudes/mis-solicitudes.component')
        .then(m => m.MisSolicitudesComponent)
  },
  { path: '**',        redirectTo: 'calendario' }
];
 
