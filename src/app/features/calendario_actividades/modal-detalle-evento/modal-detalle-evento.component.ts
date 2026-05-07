import {
  Component, Input, Output, EventEmitter,
  OnInit, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActividadService } from '../../../core/services/calendario-actividades.service';
import {
  ActividadDetallePublica,
  CATEGORIA_COLOR,
  CATEGORIA_EMOJI
} from '../../../core/models/actividad.model';

@Component({
  selector: 'app-modal-detalle-evento',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './modal-detalle-evento.component.html',
  styleUrl: './modal-detalle-evento.component.css'
})
export class ModalDetalleEventoComponent implements OnInit {

  @Input({ required: true }) idActividad!: number;
  @Output() cerrado = new EventEmitter<void>();

  private servicio = inject(ActividadService);

  cargando = false;
  error = '';
  detalle: ActividadDetallePublica | null = null;

  // Paleta compartida
  catEmoji = CATEGORIA_EMOJI;
  catColor = CATEGORIA_COLOR;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.servicio.getDetalleActividad(this.idActividad).subscribe({
      next: data => {
        this.detalle = data;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'No se pudo cargar el detalle.';
      }
    });
  }

  cerrar(): void {
    this.cerrado.emit();
  }

  cerrarSiOverlay(evento: MouseEvent): void {
    const target = evento.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.cerrar();
    }
  }

  // Helpers visuales
  getEmoji(categoria: string): string {
    return this.catEmoji[categoria] ?? '📌';
  }
  getColor(categoria: string): string {
    return this.catColor[categoria] ?? 'linear-gradient(135deg,#a8d5cc,#71B6A7)';
  }
  formatHora(h: string): string {
    return h ? h.substring(0, 5) : '';
  }

  // Etiqueta legible para tipo de organizador
  tipoOrganizadorLabel(tipo: string): string {
    return tipo === 'CARRERA' ? 'Carrera' : 'Departamento';
  }

  // Indica si el lugar tiene coordenadas para pintar el punto en el mapa
  get lugarTieneCoords(): boolean {
    return !!(this.detalle?.lugar?.coordX != null && this.detalle?.lugar?.coordY != null);
  }
}
