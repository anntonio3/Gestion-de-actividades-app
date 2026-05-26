import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-restablecer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer.component.html',
  styleUrl: './restablecer.component.css'
})
export class RestablecerComponent implements OnInit {

  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token         = '';
  verificando   = true;   // validando token al cargar
  tokenInvalido = false;  // token expirado o ya usado
  cargando      = false;
  exito         = false;
  error         = '';
  mostrarPass      = false;
  mostrarConfirm   = false;

  form = this.fb.group({
    nuevaContrasena:     ['', [Validators.required, Validators.minLength(6)]],
    confirmarContrasena: ['', [Validators.required]]
  }, { validators: this.validarCoincidencia });

  private validarCoincidencia(group: AbstractControl) {
    const nueva   = group.get('nuevaContrasena')?.value;
    const confirm = group.get('confirmarContrasena')?.value;
    return nueva && confirm && nueva !== confirm ? { noCoinciden: true } : null;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    if (!this.token) {
      this.tokenInvalido = true;
      this.verificando   = false;
      return;
    }

    // Verificar token antes de mostrar el formulario
    this.auth.verificarToken(this.token).subscribe({
      next: ({ valido }) => {
        this.tokenInvalido = !valido;
        this.verificando   = false;
      },
      error: () => {
        this.tokenInvalido = true;
        this.verificando   = false;
      }
    });
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  get noCoinciden(): boolean {
    return this.form.hasError('noCoinciden') &&
           !!this.form.get('confirmarContrasena')?.touched;
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.cargando = true;
    this.error    = '';

    this.auth.restablecer({
      token:               this.token,
      nuevaContrasena:     v.nuevaContrasena!,
      confirmarContrasena: v.confirmarContrasena!
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.exito    = true;
        // Redirigir al login automaticamente despues de 3 segundos
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al restablecer la contraseña. Intenta de nuevo.';
      }
    });
  }
}
