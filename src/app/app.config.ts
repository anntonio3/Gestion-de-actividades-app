import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import localeEs from '@angular/common/locales/es';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { registerLocaleData } from '@angular/common';

// Registrar el locale español globalmente
registerLocaleData(localeEs, 'es-MX');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-MX' }   // ← NUEVO
  ]
};