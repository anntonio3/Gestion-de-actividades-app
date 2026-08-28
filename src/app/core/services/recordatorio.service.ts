import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface RecordatorioProgreso {
  enviados: number;
  total: number;
  estado: 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
  mensaje: string;
}

/**
 * US-07: Servicio para disparar el envío masivo de recordatorios.
 * Usa fetch con SSE manual para poder enviar el token JWT en el header.
 */
@Injectable({ providedIn: 'root' })
export class RecordatorioService {

  private readonly base = 'http://localhost:8181/api/actividades';

  enviarRecordatorios(idActividad: number, idUsuario: number, token: string): Observable<RecordatorioProgreso> {
    return new Observable(observer => {
      const ctrl = new AbortController();

      fetch(`${this.base}/${idActividad}/recordatorio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ idUsuario }),
        signal: ctrl.signal
      })
      .then(async res => {
        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let dataLine = '';
          for (const line of lines) {
            if (line.startsWith('data:')) {
              dataLine = line.slice(5).trim();
            } else if (line === '' && dataLine) {
              try {
                const progreso: RecordatorioProgreso = JSON.parse(dataLine);
                observer.next(progreso);
                if (progreso.estado === 'COMPLETADO' || progreso.estado === 'ERROR') {
                  observer.complete();
                  return;
                }
              } catch { /* ignorar líneas no-JSON */ }
              dataLine = '';
            }
          }
        }
        observer.complete();
      })
      .catch(err => {
        if (err.name !== 'AbortError') observer.error(err);
      });

      return () => ctrl.abort();
    });
  }
}