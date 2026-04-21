import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Formacion } from '../../../../models/formacion.model';
import { FormacionTrabajadorService } from '../../../../services/formacion-trabajador.service';

@Component({
  selector: 'app-modal-participantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-participantes.component.html',
})
export class ModalParticipantesComponent implements OnInit, OnDestroy {
  @Input({ required: true }) formacion!: Formacion;
  @Output() close = new EventEmitter<void>();

  ftService = inject(FormacionTrabajadorService);

  searchQuery = '';
  activeTab: 'participantes' | 'disponibles' = 'participantes';

  // Ocultar barra de scroll del body
  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.loadData();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  loadData() {
    this.ftService.loadTrabajadores(this.formacion.id, this.searchQuery).subscribe();
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.loadData();
  }

  toggleAsignacion(trabajadorId: number, currentAssigned: boolean): void {
    const obs$ = currentAssigned
      ? this.ftService.removeTrabajador(this.formacion.id, trabajadorId)
      : this.ftService.addTrabajador(this.formacion.id, trabajadorId);
    obs$.subscribe();
  }
}
