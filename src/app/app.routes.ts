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
  {
    path: 'admin/espacios',
    loadComponent: () =>
      import('./features/admin/mapa-espacios/mapa-espacios.component')
        .then(m => m.MapaEspaciosComponent)
  },
  // US-07/US-08/US-09/US-10
  {
    path: 'admin/revisar-solicitudes',
    loadComponent: () =>
      import('./features/vicerrectoria/revisar-solicitudes/revisar-solicitudes.component')
        .then(m => m.RevisarSolicitudesComponent)
  },
  {
    path: 'admin/inmobiliario',
    loadComponent: () =>
      import('./features/admin/inmobiliario/inmobiliario.component')
        .then(m => m.InmobiliarioComponent)
  },
  {
    path: 'corcho',
    loadComponent: () =>
      import('./features/corcho/corcho.component')
        .then(m => m.CorchoComponent)
  },
  {
    path: 'avisos/mis-avisos',
    loadComponent: () =>
      import('./features/avisos/mis-avisos/mis-avisos.component')
        .then(m => m.MisAvisosComponent)
  },
  {
    path: 'avisos/registrar',
    loadComponent: () =>
      import('./features/avisos/registrar-aviso/registrar-aviso.component')
        .then(m => m.RegistrarAvisoComponent)
  },
  {
    path: 'avisos/editar/:id',
    loadComponent: () =>
      import('./features/avisos/registrar-aviso/registrar-aviso.component')
        .then(m => m.RegistrarAvisoComponent)
  },
  { path: '**',        redirectTo: 'calendario' }
];
 
