import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  cargando = false;
  error    = '';
  mostrarPass    = false;
  mostrarConfirm = false;

  form = this.fb.group({
    matricula:          ['', [Validators.required, Validators.maxLength(20)]],
    nombre:             ['', [Validators.required, Validators.maxLength(100)]],
    apellidos:          ['', [Validators.required, Validators.maxLength(100)]],
    correo:             ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    contrasena:         ['', [Validators.required, Validators.minLength(6)]],
    confirmarContrasena:['', [Validators.required]]
  }, { validators: this.validarContrasenas });

  private validarContrasenas(group: AbstractControl) {
    const pass    = group.get('contrasena')?.value;
    const confirm = group.get('confirmarContrasena')?.value;
    return pass && confirm && pass !== confirm ? { noCoinciden: true } : null;
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

    this.auth.registro({
      matricula:           v.matricula!.trim(),
      nombre:              v.nombre!.trim(),
      apellidos:           v.apellidos!.trim(),
      correo:              v.correo!.trim().toLowerCase(),
      contrasena:          v.contrasena!,
      confirmarContrasena: v.confirmarContrasena!
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/calendario']);
      },
      error: err => {
        this.cargando = false;
        this.error = err.mensajeAmigable ?? 'Error al crear la cuenta. Intenta de nuevo.';
      }
    });
  }
}
