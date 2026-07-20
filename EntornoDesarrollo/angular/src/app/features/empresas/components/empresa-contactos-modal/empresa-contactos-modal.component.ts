import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactosEmpresasApiService } from '../../../../services/contactos-empresas-api.service';
import { ToastService } from '../../../../services/toast.service';
import { ContactoEmpresa } from '../../../../models/contacto-empresa.model';

interface NuevoContactoForm {
  nombre: string;
  primer_apellido: string;
  telefono: string;
  email: string;
  cargo: string;
}

@Component({
  selector: 'app-empresa-contactos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empresa-contactos-modal.component.html',
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
    .repeat-delete-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #fcd4d0;
      border-radius: 6px;
      background: #fef2f2;
      color: #dc2626;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .repeat-delete-btn:hover {
      background: #fee2e2;
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
export class EmpresaContactosModalComponent implements OnInit {
  @Input() idEmpresa!: number;
  @Input() nombreEmpresa: string | null = null;
  @Output() close = new EventEmitter<void>();

  private readonly contactosApi = inject(ContactosEmpresasApiService);
  private readonly toast = inject(ToastService);

  contactos: ContactoEmpresa[] = [];
  loadingContactos = false;

  showNewContacto = false;
  newContacto: NuevoContactoForm = this.emptyContacto();
  savingContacto = false;

  ngOnInit(): void {
    this.loadContactos();
  }

  private emptyContacto(): NuevoContactoForm {
    return { nombre: '', primer_apellido: '', telefono: '', email: '', cargo: '' };
  }

  loadContactos(): void {
    this.loadingContactos = true;
    this.contactosApi.findAll(this.idEmpresa).subscribe({
      next: (res) => { this.contactos = res.data ?? []; this.loadingContactos = false; },
      error: () => { this.loadingContactos = false; this.toast.show('error', '✗ No se pudieron cargar los contactos.'); },
    });
  }

  openNewContacto(): void {
    this.newContacto = this.emptyContacto();
    this.showNewContacto = true;
  }

  cancelNewContacto(): void {
    this.showNewContacto = false;
  }

  saveNewContacto(): void {
    if (!this.newContacto.nombre) {
      this.toast.show('warning', 'El nombre es obligatorio.');
      return;
    }
    this.savingContacto = true;
    this.contactosApi.create({
      ...this.newContacto,
      id_empresa: this.idEmpresa,
    }).subscribe({
      next: () => {
        this.savingContacto = false;
        this.showNewContacto = false;
        this.toast.show('success', '✓ Contacto añadido');
        this.loadContactos();
      },
      error: () => {
        this.savingContacto = false;
        this.toast.show('error', '✗ No se pudo añadir el contacto.');
      },
    });
  }

  deleteContacto(id: number): void {
    this.contactosApi.delete(id).subscribe({
      next: () => { this.toast.show('success', '✓ Contacto eliminado'); this.loadContactos(); },
      error: () => this.toast.show('error', '✗ No se pudo eliminar el contacto.'),
    });
  }
}
