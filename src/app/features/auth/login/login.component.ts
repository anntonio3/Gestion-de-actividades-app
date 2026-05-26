import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SesionService } from '../../../core/services/sesion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  cargando = false;
  error    = '';
  mostrarContrasena = false;

  form = this.fb.group({
    identificador: ['', [Validators.required]],
    contrasena:    ['', [Validators.required, Validators.minLength(4)]]
  });

  get identificadorEsMatricula(): boolean {
    const val = this.form.get('identificador')?.value ?? '';

    return !!val && /^\d+$/.test(val);
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { identificador, contrasena } = this.form.getRawValue();
    this.cargando = true;
    this.error    = '';

    this.auth.login({ identificador: identificador!, contrasena: contrasena! }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/calendario']);
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al iniciar sesion. Intenta de nuevo.';
      }
    });
  }
}
