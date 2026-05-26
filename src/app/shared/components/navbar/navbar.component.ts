import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SesionService } from '../../../core/services/sesion.service';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  ruta: string;
  icono: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  // Inputs mantenidos por compatibilidad; si no se pasan, se usan los datos de sesion
  @Input() nombreUsuario: string = '';
  @Input() inicialesUsuario: string = '';
  @Input() rutaRegresar: string = '/';
  @Input() mostrarRegresar: boolean = true;
  @Input() titulo: string = '';

  readonly sesion = inject(SesionService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elRef  = inject(ElementRef);

  dropdownAbierto: 'profesor' | 'admin' | 'usuario' | null = null;

  // Nombre a mostrar: preferir sesion real sobre el input
  get nombreMostrado(): string {
    const u = this.sesion.usuario();
    if (u) return this.sesion.getNombreCorto();
    return this.nombreUsuario || 'Visitante';
  }

  get inicialesMostradas(): string {
    const u = this.sesion.usuario();
    if (u) return u.iniciales;
    return this.inicialesUsuario || 'V';
  }

  readonly menuProfesor: MenuItem[] = [
    { label: 'Registrar actividad', ruta: '/actividades/registrar', icono: 'add_circle' },
    { label: 'Mis publicaciones',   ruta: '/mis-publicaciones',     icono: 'folder_managed' },
    { label: 'Corcho digital',      ruta: '/corcho',                icono: 'push_pin' },
    { label: 'Mis avisos',          ruta: '/avisos/mis-avisos',     icono: 'campaign' }
  ];

  readonly menuAdmin: MenuItem[] = [
    { label: 'Revisar solicitudes', ruta: '/admin/revisar-solicitudes', icono: 'fact_check' },
    { label: 'Espacios',            ruta: '/admin/espacios',            icono: 'map' },
    { label: 'Inmobiliario',        ruta: '/admin/inmobiliario',        icono: 'chair' },
    { label: 'Usuarios',            ruta: '/admin/usuarios',            icono: 'manage_accounts' }
  ];

  toggleDropdown(menu: 'profesor' | 'admin' | 'usuario', event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownAbierto = this.dropdownAbierto === menu ? null : menu;
  }

  cerrarDropdowns(): void {
    this.dropdownAbierto = null;
  }

  cerrarSesion(): void {
    this.cerrarDropdowns();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.role-dropdown') && !target.closest('.user-dropdown')) {
      this.dropdownAbierto = null;
    }
  }
}
