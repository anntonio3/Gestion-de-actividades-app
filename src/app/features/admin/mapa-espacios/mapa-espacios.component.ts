import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { EspacioAdminService } from '../../../core/services/espacio-admin.service';
import { MapaPunto } from '../../../core/models/espacio-admin.model';
import { ModalEspacioComponent } from './modal-espacio/modal-espacio.component';
import { ModalDetalleComponent } from './modal-detalle/modal-detalle.component';

@Component({
  selector: 'app-mapa-espacios',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ModalEspacioComponent, ModalDetalleComponent],
  templateUrl: './mapa-espacios.component.html',
  styleUrl: './mapa-espacios.component.css'
})
export class MapaEspaciosComponent implements OnInit {

  private servicio = inject(EspacioAdminService);

  // Datos
  puntos: MapaPunto[] = [];
  cargando = true;
  error = '';

  // Cache de "puntos pequeños" calculado tras cargar
  private idsPequenos = new Set<number>();

  // Umbral en porcentaje para considerar dos puntos "pegados"
  private readonly UMBRAL_CLUSTER = 4.5;

  // Popup informativo
  puntoSeleccionado: MapaPunto | null = null;
  popupX = 0;
  popupY = 0;

  // Modal de detalle (solo lectura)
  modalDetalleAbierto = false;
  idEspacioDetalle: number | null = null;

  // Modal de alta/edición
  modalEdicionAbierto = false;
  modoEdicion = false;
  idPuntoModal: number | null = null;
  idEspacioModal: number | null = null;

  // Mensaje flash
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
        this.calcularPuntosPequenos();
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al cargar el mapa.';
      }
    });
  }

  /**
   * Para cada punto, busca si tiene otro a una distancia < UMBRAL_CLUSTER.
   * Si la tiene, lo marca como pequeño.
   */
  private calcularPuntosPequenos(): void {
    this.idsPequenos.clear();
    for (let i = 0; i < this.puntos.length; i++) {
      for (let j = 0; j < this.puntos.length; j++) {
        if (i === j) continue;
        const dx = this.puntos[i].coordX - this.puntos[j].coordX;
        const dy = this.puntos[i].coordY - this.puntos[j].coordY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.UMBRAL_CLUSTER) {
          this.idsPequenos.add(this.puntos[i].idPunto);
          break;
        }
      }
    }
  }

  esPequeno(punto: MapaPunto): boolean {
    return this.idsPequenos.has(punto.idPunto);
  }

  // Estadísticas
  get totalPuntos(): number { return this.puntos.length; }
  get totalAsignados(): number { return this.puntos.filter(p => p.idEspacio !== null).length; }
  get totalVacios(): number { return this.puntos.filter(p => p.idEspacio === null).length; }

  // Click en círculo
  onClickPunto(punto: MapaPunto, evento: MouseEvent): void {
    evento.stopPropagation();

    // Sin espacio asignado: abrir modal de alta directamente
    if (punto.idEspacio === null) {
      this.abrirModalAlta(punto.idPunto);
      this.cerrarPopup();
      return;
    }

    // Con espacio: mostrar popup informativo
    this.puntoSeleccionado = punto;
    const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.popupX = rect.left + rect.width / 2;
    this.popupY = rect.top + window.scrollY;
  }

  cerrarPopup(): void {
    this.puntoSeleccionado = null;
  }

  // ─────────────────────────────────────────────
  // MODAL DE ALTA
  // ─────────────────────────────────────────────
  abrirModalAlta(idPunto: number): void {
    this.idPuntoModal = idPunto;
    this.idEspacioModal = null;
    this.modoEdicion = false;
    this.modalEdicionAbierto = true;
  }

  // ─────────────────────────────────────────────
  // MODAL DE DETALLE (desde el popup "Ver")
  // ─────────────────────────────────────────────
  abrirModalDetalle(): void {
    if (!this.puntoSeleccionado || this.puntoSeleccionado.idEspacio === null) return;
    this.idEspacioDetalle = this.puntoSeleccionado.idEspacio;
    this.modalDetalleAbierto = true;
    this.cerrarPopup();
  }

  onCerrarDetalle(): void {
    this.modalDetalleAbierto = false;
  }

  // Desde el modal de detalle se solicita editar
  onEditarDesdeDetalle(): void {
    if (this.idEspacioDetalle === null) return;
    // Buscar el punto al que pertenece el espacio
    const puntoOrigen = this.puntos.find(p => p.idEspacio === this.idEspacioDetalle);
    if (!puntoOrigen) return;

    this.idEspacioModal = this.idEspacioDetalle;
    this.idPuntoModal = puntoOrigen.idPunto;
    this.modoEdicion = true;
    this.modalDetalleAbierto = false;
    this.modalEdicionAbierto = true;
  }

  // ─────────────────────────────────────────────
  // ACCIONES DEL POPUP
  // ─────────────────────────────────────────────
  toggleEstado(): void {
    if (!this.puntoSeleccionado || this.puntoSeleccionado.idEspacio === null) return;

    const nuevoEstado = !this.puntoSeleccionado.activo;
    const idEsp = this.puntoSeleccionado.idEspacio;

    this.servicio.cambiarEstado(idEsp, nuevoEstado).subscribe({
      next: () => {
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

  // ─────────────────────────────────────────────
  // CALLBACKS DEL MODAL DE EDICIÓN
  // ─────────────────────────────────────────────
  onGuardado(): void {
    this.modalEdicionAbierto = false;
    this.cargarPuntos();
    this.mostrarFlash(this.modoEdicion ? 'Espacio actualizado' : 'Espacio registrado');
  }

  onCerrarModalEdicion(): void {
    this.modalEdicionAbierto = false;
  }

  private mostrarFlash(mensaje: string): void {
    this.mensajeFlash = mensaje;
    setTimeout(() => this.mensajeFlash = '', 3000);
  }
}