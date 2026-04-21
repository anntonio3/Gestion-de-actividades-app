import { Routes } from '@angular/router';
import { CalendarioComponent } from './features/calendario/calendario.component';

export const routes: Routes = [
  { path: '',          redirectTo: 'calendario', pathMatch: 'full' },
  { path: 'calendario', component: CalendarioComponent },
  { path: '**',        redirectTo: 'calendario' }
];
 
