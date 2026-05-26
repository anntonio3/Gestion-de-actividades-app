import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RecuperacionResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
  styleUrl: './recuperar.component.css'
})
export class RecuperarComponent {

  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  cargando  = false;
  error     = '';
  // null = aun no enviado; objeto = ya se envio (muestra mensaje de exito)
  respuesta: RecuperacionResponse | null = null;

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]]
  });

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.cargando = true;
    this.error    = '';

    this.auth.recuperar({ correo: this.form.get('correo')!.value!.trim() }).subscribe({
      next: res => {
        this.cargando  = false;
        this.respuesta = res;
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al procesar la solicitud. Intenta de nuevo.';
      }
    });
  }
}
