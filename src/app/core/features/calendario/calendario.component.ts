import { Component, OnInit } from "@angular/core";
import { Actividad } from "../../models/actividad.model";
import { ActividadService } from "../../services/actividades.service";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.component.html',
})
export class CalendarioComponent implements OnInit {
  actividades: Actividad[] = [];
  tipoSeleccionado?: number;

  tipos = [
    { id: 1, nombre: 'Académica' },
    { id: 2, nombre: 'Cultural' },
    { id: 3, nombre: 'Deportiva' }
  ];

  constructor(private actividadService: ActividadService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.actividadService.getActividadesPublicas(this.tipoSeleccionado)
      .subscribe(data => this.actividades = data);
  }

  filtrar(idTipo?: number) {
    this.tipoSeleccionado = idTipo;
    this.cargar();
  }
}