import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { EspacioAdminService } from '../../../core/services/espacio-admin.service';
import { MapaPunto } from '../../../core/models/espacio-admin.model';
import { ModalEspacioComponent } from './modal-espacio/modal-espacio.component';

@Component({
  selector: 'app-mapa-espacios',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ModalEspacioComponent],
  templateUrl: './mapa-espacios.component.html',
  styleUrl: './mapa-espacios.component.css'
})
export class MapaEspaciosComponent implements OnInit {

  private servicio = inject(EspacioAdminService);

  // Datos
  puntos: MapaPunto[] = [];
  cargando = true;
  error = '';

  // Popup informativo (al click en círculo asignado)
  puntoSeleccionado: MapaPunto | null = null;
  popupX = 0;
  popupY = 0;

  // Modal de alta/edicion
  modalAbierto = false;
  modoEdicion = false;
  idPuntoModal: number | null = null;
  idEspacioModal: number | null = null;

  // Mensaje flash de exito
  mensajeFlash = '';

  ngOnInit(): void {
    this.cargarPuntos();
  }

  cargarPuntos(): void {
    this.cargando = true;
    this.error = '';
    this.servicio.listarPuntos().subscribe({
      next: data => {
        this.puntos = data;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al cargar el mapa.';
      }
    });
  }

  // Estadisticas para el header
  get totalPuntos(): number { return this.puntos.length; }
  get totalAsignados(): number { return this.puntos.filter(p => p.idEspacio !== null).length; }
  get totalVacios(): number { return this.puntos.filter(p => p.idEspacio === null).length; }

  // Click en un circulo del mapa
  onClickPunto(punto: MapaPunto, evento: MouseEvent): void {
    evento.stopPropagation();

    // Si el punto NO tiene espacio asignado, abrir modal de alta directo
    if (punto.idEspacio === null) {
      this.abrirModalAlta(punto.idPunto);
      this.cerrarPopup();
      return;
    }

    // Si ya tiene espacio, mostrar popup informativo
    this.puntoSeleccionado = punto;
    const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.popupX = rect.left + rect.width / 2;
    this.popupY = rect.top + window.scrollY;
  }

  // Click fuera del popup lo cierra
  cerrarPopup(): void {
    this.puntoSeleccionado = null;
  }

  // Abrir modal en modo alta
  abrirModalAlta(idPunto: number): void {
    this.idPuntoModal = idPunto;
    this.idEspacioModal = null;
    this.modoEdicion = false;
    this.modalAbierto = true;
  }

  // Abrir modal en modo edicion (desde el popup)
  abrirModalEdicion(): void {
    if (!this.puntoSeleccionado || this.puntoSeleccionado.idEspacio === null) return;
    this.idEspacioModal = this.puntoSeleccionado.idEspacio;
    this.idPuntoModal = this.puntoSeleccionado.idPunto;
    this.modoEdicion = true;
    this.modalAbierto = true;
    this.cerrarPopup();
  }

  // Activar / desactivar desde el popup
  toggleEstado(): void {
    if (!this.puntoSeleccionado || this.puntoSeleccionado.idEspacio === null) return;

    const nuevoEstado = !this.puntoSeleccionado.activo;
    const idEsp = this.puntoSeleccionado.idEspacio;

    this.servicio.cambiarEstado(idEsp, nuevoEstado).subscribe({
      next: () => {
        // Actualizar localmente el estado del punto
        const idx = this.puntos.findIndex(p => p.idEspacio === idEsp);
        if (idx !== -1) {
          this.puntos[idx] = { ...this.puntos[idx], activo: nuevoEstado };
          this.puntoSeleccionado = this.puntos[idx];
        }
        this.mostrarFlash(nuevoEstado ? 'Espacio activado' : 'Espacio desactivado');
      },
      error: err => {
        this.mostrarFlash(err.mensajeAmigable ?? 'Error al cambiar el estado');
      }
    });
  }

  // El modal nos avisa que se guardo correctamente
  onGuardado(): void {
    this.modalAbierto = false;
    this.cargarPuntos();
    this.mostrarFlash(this.modoEdicion ? 'Espacio actualizado' : 'Espacio registrado');
  }

  onCerrarModal(): void {
    this.modalAbierto = false;
  }

  private mostrarFlash(mensaje: string): void {
    this.mensajeFlash = mensaje;
    setTimeout(() => this.mensajeFlash = '', 3000);
  }
}
