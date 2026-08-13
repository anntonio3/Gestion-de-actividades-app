import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RecordatorioService, RecordatorioProgreso } from '../../../../core/services/recordatorio.service';

@Component({
  selector: 'app-modal-recordatorio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-recordatorio.component.html',
  styleUrls: ['./modal-recordatorio.component.css']
})
export class ModalRecordatorioComponent implements OnDestroy {

  @Input() idActividad!: number;
  @Input() idUsuario!: number;
  @Input() token!: string;
  @Input() nombreActividad!: string;
  @Output() cerrar = new EventEmitter<void>();

  estado: 'IDLE' | 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR' = 'IDLE';
  enviados = 0;
  total    = 0;
  mensaje  = '';

  private sub?: Subscription;

  constructor(private recordatorioService: RecordatorioService) {}

  get porcentaje(): number {
    return this.total === 0 ? 0 : Math.round((this.enviados / this.total) * 100);
  }

  iniciarEnvio(): void {
    this.estado   = 'EN_PROGRESO';
    this.enviados = 0;
    this.total    = 0;
    this.mensaje  = 'Iniciando envío...';

    this.sub = this.recordatorioService
      .enviarRecordatorios(this.idActividad, this.idUsuario, this.token)
      .subscribe({
        next: (p: RecordatorioProgreso) => {
          this.enviados = p.enviados;
          this.total    = p.total;
          this.mensaje  = p.mensaje;
          this.estado   = p.estado as any;
        },
        error: () => {
          this.estado  = 'ERROR';
          this.mensaje = 'Error de conexión. Intenta de nuevo.';
        }
      });
  }

  onCerrar(): void {
    this.sub?.unsubscribe();
    this.cerrar.emit();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}