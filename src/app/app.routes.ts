import { Routes } from '@angular/router';
import { CalendarioComponent } from './features/calendario_actividades/calendario.component';
import { authGuard, profesorGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'calendario', pathMatch: 'full' },

  // Rutas publicas
  { path: 'calendario', component: CalendarioComponent },
  {
    path: 'corcho',
    loadComponent: () =>
      import('./features/corcho/corcho.component').then(m => m.CorchoComponent)
  },

  // Autenticacion
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/registro',
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'auth/recuperar',
    loadComponent: () =>
      import('./features/auth/recuperar/recuperar.component').then(m => m.RecuperarComponent)
  },
  {
    path: 'auth/restablecer/:token',
    loadComponent: () =>
      import('./features/auth/restablecer/restablecer.component').then(m => m.RestablecerComponent)
  },

  // Rutas de PROFESOR (requieren login y rol profesor)
  {
    path: 'actividades/registrar',
    canActivate: [profesorGuard],
    loadComponent: () =>
      import('./features/actividades/registrar-actividad/registrar-actividad.component')
        .then(m => m.RegistrarActividadComponent)
  },
  {
    path: 'mis-publicaciones',
    canActivate: [profesorGuard],
    loadComponent: () =>
      import('./features/actividades/mis-solicitudes/mis-solicitudes.component')
        .then(m => m.MisSolicitudesComponent)
  },
  {
    path: 'avisos/mis-avisos',
    canActivate: [profesorGuard],
    loadComponent: () =>
      import('./features/avisos/mis-avisos/mis-avisos.component')
        .then(m => m.MisAvisosComponent)
  },
  {
    path: 'avisos/registrar',
    canActivate: [profesorGuard],
    loadComponent: () =>
      import('./features/avisos/registrar-aviso/registrar-aviso.component')
        .then(m => m.RegistrarAvisoComponent)
  },
  {
    path: 'avisos/editar/:id',
    canActivate: [profesorGuard],
    loadComponent: () =>
      import('./features/avisos/registrar-aviso/registrar-aviso.component')
        .then(m => m.RegistrarAvisoComponent)
  },
  {
    path: 'mis-inscripciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inscripciones/mis-inscripciones/mis-inscripciones.component')
        .then(m => m.MisInscripcionesComponent)
  },

  // Rutas de ADMIN (requieren login y rol admin)
  {
    path: 'admin/revisar-solicitudes',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/vicerrectoria/revisar-solicitudes/revisar-solicitudes.component')
        .then(m => m.RevisarSolicitudesComponent)
  },
  {
    path: 'admin/espacios',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/mapa-espacios/mapa-espacios.component')
        .then(m => m.MapaEspaciosComponent)
  },
  {
    path: 'admin/inmobiliario',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/inmobiliario/inmobiliario.component')
        .then(m => m.InmobiliarioComponent)
  },
  {
    path: 'admin/usuarios',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/usuarios/lista-usuarios/lista-usuarios.component')
        .then(m => m.ListaUsuariosComponent)
  },
  {
    path: 'admin/usuarios/nuevo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/usuarios/form-usuario/form-usuario.component')
        .then(m => m.FormUsuarioComponent)
  },
  {
    path: 'admin/usuarios/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/usuarios/form-usuario/form-usuario.component')
        .then(m => m.FormUsuarioComponent)
  },

  { path: '**', redirectTo: 'calendario' }
];
 
