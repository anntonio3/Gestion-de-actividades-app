import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EspacioAdminService } from '../../../../core/services/espacio-admin.service';
import { EspacioDetalle } from '../../../../core/models/espacio-admin.model';

@Component({
  selector: 'app-modal-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle.component.html',
  styleUrl: './modal-detalle.component.css'
})
export class ModalDetalleComponent implements OnInit, OnChanges {

  @Input() idEspacio: number | null = null;

  // Eventos al padre
  @Output() editar = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  private servicio = inject(EspacioAdminService);

  cargando = false;
  error = '';
  detalle: EspacioDetalle | null = null;

  ngOnInit(): void {
    if (this.idEspacio !== null) {
      this.cargar(this.idEspacio);
    }
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['idEspacio'] && this.idEspacio !== null) {
      this.cargar(this.idEspacio);
    }
  }

  cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.servicio.obtenerDetalle(id).subscribe({
      next: data => {
        this.detalle = data;
        this.cargando = false;
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al cargar el detalle';
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

  onEditar(): void {
    this.editar.emit();
  }
}