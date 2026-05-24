import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CorchoService } from '../../core/services/corcho.service';
import {
  Aviso, PAPELES_PASTEL, CHINCHETAS, CINTAS
} from '../../core/models/aviso.model';

type FiltroFecha = 'TODOS' | 'HOY' | 'SEMANA' | 'MES' | 'CUSTOM';

@Component({
  selector: 'app-corcho',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, DatePipe],
  templateUrl: './corcho.component.html',
  styleUrl: './corcho.component.css'
})
export class CorchoComponent implements OnInit {

  private readonly corchoService = inject(CorchoService);

  // Datos
  avisos: Aviso[] = [];
  cargando = true;
  error = '';

  // Filtros UI
  filtroActivo: FiltroFecha = 'TODOS';
  fechaCustom = '';

  // Modal de detalle
  avisoSeleccionado: Aviso | null = null;

  // Paletas
  private readonly papeles = PAPELES_PASTEL;
  private readonly chinchetas = CHINCHETAS;
  private readonly cintas = CINTAS;

  ngOnInit(): void {
    this.cargar();
  }

  // ────────────────────────────────────────────────────────
  // Carga y filtros
  // ────────────────────────────────────────────────────────
  cargar(): void {
    this.cargando = true;
    this.error = '';

    const params = this.calcularRangoFiltro();
    this.corchoService.listar(params.fecha, params.desde, params.hasta).subscribe({
      next: data => {
        this.avisos = data;
        this.cargando = false;
      },
      error: err => {
        this.error = err.mensajeAmigable ?? 'No se pudo cargar el corcho.';
        this.cargando = false;
      }
    });
  }

  setFiltro(filtro: FiltroFecha): void {
    this.filtroActivo = filtro;
    if (filtro !== 'CUSTOM') {
      this.fechaCustom = '';
      this.cargar();
    }
  }

  aplicarFechaCustom(): void {
    if (this.fechaCustom) this.cargar();
  }

  limpiarFiltros(): void {
    this.filtroActivo = 'TODOS';
    this.fechaCustom = '';
    this.cargar();
  }

  private calcularRangoFiltro(): { fecha?: string; desde?: string; hasta?: string } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (this.filtroActivo) {
      case 'HOY':
        return { fecha: this.formatoYMD(hoy) };

      case 'SEMANA': {
        const fin = new Date(hoy);
        fin.setDate(hoy.getDate() + 7);
        return { desde: this.formatoYMD(hoy), hasta: this.formatoYMD(fin) };
      }

      case 'MES': {
        const fin = new Date(hoy);
        fin.setMonth(hoy.getMonth() + 1);
        return { desde: this.formatoYMD(hoy), hasta: this.formatoYMD(fin) };
      }

      case 'CUSTOM':
        return this.fechaCustom ? { fecha: this.fechaCustom } : {};

      default:
        return {};
    }
  }

  private formatoYMD(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ────────────────────────────────────────────────────────
  // Modal de detalle
  // ────────────────────────────────────────────────────────
  abrirDetalle(aviso: Aviso): void {
    this.avisoSeleccionado = aviso;
  }

  cerrarDetalle(e?: MouseEvent): void {
    if (e && !(e.target as HTMLElement).classList.contains('modal-overlay')) return;
    this.avisoSeleccionado = null;
  }

  // ────────────────────────────────────────────────────────
  // Helpers de estilo del tablero
  // Asignan colores y decoración rotando por idAviso para que
  // sea consistente entre recargas (no random puro).
  // ────────────────────────────────────────────────────────

  /** Color de papel pastel asignado al aviso */
  papelDe(aviso: Aviso): string {
    return this.papeles[aviso.idAviso % this.papeles.length].bg;
  }

  /** Sombra inferior del papel (un tono mas oscuro del mismo color) */
  sombraDe(aviso: Aviso): string {
    return this.papeles[aviso.idAviso % this.papeles.length].sombra;
  }

  /** Rotación sutil en hover (±1°) */
  rotacionDe(aviso: Aviso): string {
    // Rotaciones reproducibles según paridad del id
    const rotaciones = ['-1.2deg', '0.8deg', '-0.5deg', '1.4deg', '0deg'];
    return rotaciones[aviso.idAviso % rotaciones.length];
  }

  /** Determina si lleva chincheta o cinta (alterno por idAviso) */
  tipoFijacion(aviso: Aviso): 'chincheta' | 'cinta' {
    return aviso.idAviso % 2 === 0 ? 'chincheta' : 'cinta';
  }

  colorChincheta(aviso: Aviso): string {
    return this.chinchetas[aviso.idAviso % this.chinchetas.length];
  }

  estiloCinta(aviso: Aviso): string {
    return this.cintas[aviso.idAviso % this.cintas.length];
  }

  /** Devuelve solo HH:mm sin segundos */
  formatHora(h?: string | null): string {
    return h ? h.substring(0, 5) : '';
  }
}