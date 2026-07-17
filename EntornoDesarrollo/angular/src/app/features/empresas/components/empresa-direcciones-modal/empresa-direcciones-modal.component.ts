import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DireccionesEmpresasApiService } from '../../../../services/direcciones-empresas-api.service';
import { ToastService } from '../../../../services/toast.service';
import { DireccionEmpresa } from '../../../../models/direccion-empresa.model';
import { LookupSelectComponent } from '../../../../shared/lookup-select/lookup-select.component';
import { environment } from '../../../../../environments/environment';

interface NuevaDireccionForm {
  direccion: string;
  codigoPostal: string;
  id_pais: number | null;
  id_provincia: number | null;
  id_localidad: number | null;
}

@Component({
  selector: 'app-empresa-direcciones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LookupSelectComponent],
  templateUrl: './empresa-direcciones-modal.component.html',
  styles: [`
    .repeat-card {
      position: relative;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .repeat-card .form-grid {
      grid-template-columns: 1fr 1fr;
    }
    .repeat-remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: none;
      color: var(--text-muted);
      cursor: pointer;
    }
    .repeat-remove-btn:hover {
      color: #dc2626;
      border-color: #dc2626;
    }
    .btn-add-row {
      width: 100%;
      padding: 10px;
      border: 1px dashed var(--border);
      border-radius: 8px;
      background: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-add-row:hover {
      border-color: #476fab;
      color: #476fab;
    }
    .empty-hint {
      font-size: 12px;
      color: var(--text-muted);
      padding: 8px 0 12px;
    }
  `],
})
export class EmpresaDireccionesModalComponent implements OnInit {
  @Input() idEmpresa!: number;
  @Input() nombreEmpresa: string | null = null;
  @Output() close = new EventEmitter<void>();

  private readonly direccionesApi = inject(DireccionesEmpresasApiService);
  private readonly toast = inject(ToastService);

  readonly direccionesApiUrl = `${environment.apiUrl}/direcciones-empresas`;

  direcciones: DireccionEmpresa[] = [];
  loadingDirecciones = false;

  showNewDireccion = false;
  newDireccion: NuevaDireccionForm = this.emptyDireccion();
  savingDireccion = false;

  ngOnInit(): void {
    this.loadDirecciones();
  }

  private emptyDireccion(): NuevaDireccionForm {
    return { direccion: '', codigoPostal: '', id_pais: null, id_provincia: null, id_localidad: null };
  }

  direccionUbicacion(d: DireccionEmpresa): string {
    return [d.localidad, d.provincia, d.pais].filter(Boolean).join(', ');
  }

  loadDirecciones(): void {
    this.loadingDirecciones = true;
    this.direccionesApi.findAll('', '', '', 1, 100, this.idEmpresa).subscribe({
      next: (res) => { this.direcciones = res.data ?? []; this.loadingDirecciones = false; },
      error: () => { this.loadingDirecciones = false; this.toast.show('error', '✗ No se pudieron cargar las direcciones.'); },
    });
  }

  openNewDireccion(): void {
    this.newDireccion = this.emptyDireccion();
    this.showNewDireccion = true;
  }

  cancelNewDireccion(): void {
    this.showNewDireccion = false;
  }

  onDireccionPaisChange(): void {
    this.newDireccion.id_provincia = null;
    this.newDireccion.id_localidad = null;
  }

  onDireccionProvinciaChange(): void {
    this.newDireccion.id_localidad = null;
  }

  saveNewDireccion(): void {
    if (!this.newDireccion.direccion || !this.newDireccion.codigoPostal || !this.newDireccion.id_localidad) {
      this.toast.show('warning', 'Completa dirección, código postal y localidad.');
      return;
    }
    this.savingDireccion = true;
    this.direccionesApi.create({
      direccion: this.newDireccion.direccion,
      codigoPostal: this.newDireccion.codigoPostal,
      id_localidad: this.newDireccion.id_localidad,
      id_provincia: this.newDireccion.id_provincia!,
      id_pais: this.newDireccion.id_pais!,
      id_empresa: this.idEmpresa,
      activo: true,
    }).subscribe({
      next: () => {
        this.savingDireccion = false;
        this.showNewDireccion = false;
        this.toast.show('success', '✓ Dirección añadida');
        this.loadDirecciones();
      },
      error: () => {
        this.savingDireccion = false;
        this.toast.show('error', '✗ No se pudo añadir la dirección.');
      },
    });
  }

  deleteDireccion(id: number): void {
    this.direccionesApi.delete(id).subscribe({
      next: () => { this.toast.show('success', '✓ Dirección eliminada'); this.loadDirecciones(); },
      error: () => this.toast.show('error', '✗ No se pudo eliminar la dirección.'),
    });
  }
}
