import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

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
}
