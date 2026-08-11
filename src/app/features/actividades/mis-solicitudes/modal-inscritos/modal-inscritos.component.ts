import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscritosService, InscritoItem } from '../../../../core/services/inscritos.service';

@Component({
  selector: 'app-modal-inscritos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-inscritos.component.html',
  styleUrls: ['./modal-inscritos.component.css']
})
export class ModalInscritosComponent implements OnInit {

  @Input() idActividad!: number;
  @Input() idSolicitante!: number;
  @Input() nombreActividad!: string;
  @Output() cerrar = new EventEmitter<void>();

  private readonly svc = inject(InscritosService);

  lista: InscritoItem[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.svc.obtenerLista(this.idActividad, this.idSolicitante).subscribe({
      next: data => { this.lista = data; this.cargando = false; },
      error: err  => { this.error = err.mensajeAmigable ?? 'Error al cargar la lista.'; this.cargando = false; }
    });
  }

  descargarPdf(): void { this.svc.descargarPdf(this.idActividad, this.idSolicitante); }
  descargarCsv(): void { this.svc.descargarCsv(this.idActividad, this.idSolicitante); }
  onCerrar():     void { this.cerrar.emit(); }
}