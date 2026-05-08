import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  @Input() nombreUsuario: string = 'Usuario';
  @Input() inicialesUsuario: string = 'U';
  @Input() rutaRegresar: string = '/';
  @Input() mostrarRegresar: boolean = true;
  @Input() titulo: string = '';   // ← NUEVO

  // Cual dropdown esta abierto: 'profesor' | 'admin' | null
  dropdownAbierto: 'profesor' | 'admin' | null = null;

  readonly menuProfesor: MenuItem[] = [
    { label: 'Registrar actividad', ruta: '/actividades/registrar', icono: 'add_circle' },
    { label: 'Mis publicaciones',   ruta: '/mis-publicaciones',     icono: 'folder_managed' }
  ];

  readonly menuAdmin: MenuItem[] = [
    { label: 'Revisar solicitudes', ruta: '/admin/revisar-solicitudes', icono: 'fact_check' },
    { label: 'Espacios',            ruta: '/admin/espacios',            icono: 'map' },
    { label: 'Inmobiliario',        ruta: '/admin/inmobiliario',        icono: 'chair' }
  ];

  constructor(private elRef: ElementRef) {}

  toggleDropdown(menu: 'profesor' | 'admin', event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownAbierto = this.dropdownAbierto === menu ? null : menu;
  }

  cerrarDropdowns(): void {
    this.dropdownAbierto = null;
  }

  // Cierra los dropdowns al hacer click fuera del navbar
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.role-dropdown')) {
      this.dropdownAbierto = null;
    }
  }

}
