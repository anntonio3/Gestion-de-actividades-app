import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'mis-publicaciones',
    loadComponent: () =>
      import('./features/actividades/mis-solicitudes/mis-solicitudes.component')
        .then(m => m.MisSolicitudesComponent)
  },
  { path: '', redirectTo: 'mis-publicaciones', pathMatch: 'full' }
];
