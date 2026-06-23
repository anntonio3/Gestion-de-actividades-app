// src/app/features/calendario_actividades/banner-destacado/banner-destacado.component.ts
import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventoDestacado } from '../../../core/models/destacado.model';
import { DestacadoService } from '../../../core/services/destacado.service';

@Component({
  selector: 'app-banner-destacado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner-destacado.component.html',
  styleUrl: './banner-destacado.component.css',
  host: { '[style.display]': "(destacado || cargando) ? 'flex' : 'none'" }
})
export class BannerDestacadoComponent implements OnInit {

  /** Emite el id del evento cuando el usuario pulsa "Ver detalle". */
  @Output() verDetalle = new EventEmitter<number>();

  private readonly destacadoService = inject(DestacadoService);

  destacado: EventoDestacado | null = null;
  cargando = true;
  error = false;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = false;
    this.destacadoService.obtenerDestacado().subscribe({
      next: data => {
        this.destacado = data;   // null si no hay (204)
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  onVerDetalle(): void {
    if (this.destacado) this.verDetalle.emit(this.destacado.id);
  }

  // ── Helpers de formato (mismos que el calendario) ──
  formatFecha(f: string): string {
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
  }

  formatHora(h: string): string {
    return h ? h.substring(0, 5) : '';
  }

  getIconoCategoria(categoria: string): string {
    const map: Record<string, string> = {
      'Tecnología': 'computer', 'Tecnologia': 'computer',
      'Académica': 'school', 'Academica': 'school',
      'Cultural': 'palette', 'Deportiva': 'sports_soccer',
      'Ciencia': 'science', 'Salud': 'local_hospital'
    };
    return map[categoria] ?? 'event';
  }
}
