import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse } from '../models/auth.model';

/**
 * US-00: Servicio de sesión.
 *
 * El token JWT se guarda en el signal en memoria (no en localStorage).
 * Los datos NO sensibles (nombre, tipo, iniciales) se persisten en
 * sessionStorage para sobrevivir a F5 dentro de la misma pestaña.
 * Al cerrar la pestaña/navegador la sesión se limpia automáticamente.
 *
 * El rol se lee del objeto de sesión — que proviene del payload del JWT
 * que devuelve el backend — nunca se asume desde localStorage directamente.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {

  private readonly router = inject(Router);
  private readonly SESSION_KEY = 'unpa_sesion_meta';

  // Signal reactivo con el usuario actual (null = sin sesión)
  private readonly _usuario = signal<LoginResponse | null>(this.cargarDesdeStorage());

  // Computadas de solo lectura para los componentes
  readonly usuario    = this._usuario.asReadonly();
  readonly logueado   = computed(() => this._usuario() !== null);
  readonly esAdmin    = computed(() => this._usuario()?.tipo === 'ADMIN');
  readonly esProfesor = computed(() => this._usuario()?.tipo === 'PROFESOR');
  readonly esAlumno   = computed(() => this._usuario()?.tipo === 'ALUMNO');

  // ── Iniciar sesión ──────────────────────────────────────────────

  iniciarSesion(respuesta: LoginResponse): void {
    this._usuario.set(respuesta);
    // Guardar en sessionStorage (no localStorage) para sobrevivir F5
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(respuesta));
  }

  // ── Cerrar sesión ───────────────────────────────────────────────

  cerrarSesion(): void {
    this._usuario.set(null);
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('unpa_sesion');   // limpiar legado si existe
    this.router.navigate(['/auth/login']);
  }

  // ── Getters de compatibilidad ────────────────────────────────────

  getIdUsuario(): number {
    const u = this._usuario();
    if (!u) throw new Error('No hay sesión activa');
    return u.id;
  }

  getIdProfesor(): number {
    const u = this._usuario();
    if (!u || u.tipo !== 'PROFESOR') throw new Error('El usuario no es PROFESOR');
    return u.id;
  }

  getIdAdmin(): number {
    const u = this._usuario();
    if (!u || u.tipo !== 'ADMIN') throw new Error('El usuario no es ADMIN');
    return u.id;
  }

  getNombreAdmin(): string {
    const u = this._usuario();
    return u ? `${u.nombre} ${u.apellidos}` : 'Admin';
  }

  getNombreUsuario(): string {
    const u = this._usuario();
    return u ? `${u.nombre} ${u.apellidos}` : '';
  }

  getNombreCorto(): string {
    const u = this._usuario();
    if (!u) return '';
    const apellidoCorto = u.apellidos?.split(' ')[0] ?? '';
    return `${u.nombre} ${apellidoCorto}.`;
  }

  getInicialesAdmin(): string { return this._usuario()?.iniciales ?? 'AD'; }
  getIniciales(): string      { return this._usuario()?.iniciales ?? ''; }

  // ── Persistencia (sessionStorage) ────────────────────────────────

  private cargarDesdeStorage(): LoginResponse | null {
    try {
      // Intentar sessionStorage primero (US-00)
      const raw = sessionStorage.getItem(this.SESSION_KEY)
               ?? localStorage.getItem('unpa_sesion');   // fallback legado

      if (!raw) return null;

      const parsed = JSON.parse(raw) as LoginResponse;

      if (!parsed.id || !parsed.tipo || !parsed.nombre) {
        sessionStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem('unpa_sesion');
        return null;
      }

      // Si venía del legacy (sin token), forzar nuevo login
      if (!parsed.token) {
        sessionStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem('unpa_sesion');
        return null;
      }

      return parsed;
    } catch {
      sessionStorage.removeItem(this.SESSION_KEY);
      return null;
    }
  }
}