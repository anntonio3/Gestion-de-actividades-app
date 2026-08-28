import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscritosService } from '../../../../core/services/inscritos.service';
import { InscritoItem } from '../../../../core/models/inscrito.model';

@Component({
  selector: 'app-modal-inscritos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-inscritos.component.html',
  styleUrls: ['./modal-inscritos.component.css']
})
export class ModalInscritosComponent implements OnInit {

  @Input() idActividad!: number;
  @Input() nombreActividad!: string;
  @Output() cerrar = new EventEmitter<void>();

  private readonly svc = inject(InscritosService);

  lista: InscritoItem[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    // Ya no se manda idSolicitante: el jwtInterceptor agrega el token
    // y el backend resuelve el permiso (dueño o admin) desde ahi.
    this.svc.obtenerLista(this.idActividad).subscribe({
      next: data => { this.lista = data.inscritos; this.cargando = false; },
      error: err  => { this.error = err.mensajeAmigable ?? 'Error al cargar la lista.'; this.cargando = false; }
    });
  }

  descargarPdf(): void { this.svc.descargarPdf(this.idActividad); }
  descargarCsv(): void { this.svc.descargarCsv(this.idActividad); }
  onCerrar():     void { this.cerrar.emit(); }
}