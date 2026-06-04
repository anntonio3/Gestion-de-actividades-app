import {
  Component, Input, Output, EventEmitter,
  OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { InscripcionExternoService } from '../../../core/services/inscripcion-externo.service';
import { InscripcionExternoResponse } from '../../../core/models/inscripcion-externo.model';

/** Pasos del flujo del modal */
type Paso = 'seleccion' | 'formulario' | 'exito';

@Component({
  selector: 'app-modal-inscripcion-tipo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-inscripcion-tipo.component.html',
  styleUrl: './modal-inscripcion-tipo.component.css'
})
export class ModalInscripcionTipoComponent implements OnInit {

  /** ID de la actividad en la que se quiere inscribir */
  @Input({ required: true }) idActividad!: number;

  /** Nombre del evento para mostrarlo en el modal */
  @Input({ required: true }) nombreActividad!: string;

  /** Se emite cuando el externo completa la inscripcion */
  @Output() inscritoExterno = new EventEmitter<InscripcionExternoResponse>();

  /** Se emite para cerrar el modal sin accion */
  @Output() cerrado = new EventEmitter<void>();

  private readonly fb             = inject(FormBuilder);
  private readonly router         = inject(Router);
  private readonly externoService = inject(InscripcionExternoService);

  paso: Paso        = 'seleccion';
  form!: FormGroup;
  guardando         = false;
  errorGlobal       = '';
  respuesta: InscripcionExternoResponse | null = null;

  ngOnInit(): void {
    this.construirForm();
  }

  private construirForm(): void {
    this.form = this.fb.group({
      nombre:      ['', [Validators.required, Validators.maxLength(150)]],
      edad:        [null, [Validators.required, Validators.min(1), Validators.max(120)]],
      sexo:        ['', Validators.required],
      procedencia: ['', [Validators.required, Validators.maxLength(150)]],
      correo:      ['', [Validators.email, Validators.maxLength(150)]],
      telefono:    ['', [Validators.maxLength(20)]]
    });
  }

  // ── Navegacion entre pasos ──────────────────────────────

  seleccionarTipo(tipo: 'interno' | 'externo'): void {
    if (tipo === 'interno') {
      // Redirige al login para que se autentique y use el flujo normal de inscripcion
      this.cerrar();
      this.router.navigate(['/auth/login']);
      return;
    }
    this.paso = 'formulario';
  }

  volverAlSeleccion(): void {
    this.paso        = 'seleccion';
    this.errorGlobal = '';
    this.form.reset();
  }

  // ── Envio del formulario ────────────────────────────────

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.guardando   = true;
    this.errorGlobal = '';

    // withCredentials esta configurado en el service, por lo que la cookie
    // visitante_id viaja automaticamente en la peticion.
    this.externoService.inscribir(this.idActividad, {
      nombre:      v.nombre.trim(),
      edad:        v.edad,
      sexo:        v.sexo,
      procedencia: v.procedencia.trim(),
      correo:      v.correo?.trim()   || undefined,
      telefono:    v.telefono?.trim() || undefined
    }).subscribe({
      next: res => {
        this.respuesta = res;
        this.guardando = false;
        this.paso      = 'exito';
        this.inscritoExterno.emit(res);
      },
      error: err => {
        this.guardando   = false;
        this.errorGlobal = err.mensajeAmigable
            ?? err.error?.mensaje
            ?? 'No se pudo completar la inscripcion. Intenta de nuevo.';
      }
    });
  }

  // ── Cierre del modal ────────────────────────────────────

  cerrar(): void {
    this.cerrado.emit();
  }

  cerrarSiOverlay(evento: MouseEvent): void {
    const target = evento.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.cerrar();
    }
  }

  // ── Helpers template ────────────────────────────────────

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }
}
