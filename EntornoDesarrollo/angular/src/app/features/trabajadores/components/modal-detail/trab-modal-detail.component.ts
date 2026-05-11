import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trabajador, getColorFor, getInitials } from '../../../../models/trabajador.model';

@Component({
  selector: 'app-trab-modal-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trab-modal-detail.component.html',
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .detail-item { margin-bottom: 0; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
    .detail-value { font-size: 14px; color: var(--text); font-weight: 500; }
    
    .avatar-large {
      width: 60px; height: 60px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    
    .empty-dash { color: #a1a1aa; font-weight: 400; }
    
    .section-box {
      background: #f8f9fd;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 20px;
    }
    .section-box-title {
      font-size: 12px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 16px; display: block;
    }

    .tabs-nav {
      display: flex; border-bottom: 1px solid var(--border);
      margin-bottom: 24px; gap: 0;
    }
    .tab-item {
      padding: 10px 18px; color: var(--text-muted); font-weight: 600;
      font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .tab-item:hover { color: var(--text); }
    .tab-item.active {
      color: var(--purple-dark);
      border-bottom-color: var(--purple-dark);
    }
    .tab-count {
      background: #e8eaf6; color: var(--purple-dark); border-radius: 10px; padding: 2px 7px;
      font-size: 10px; margin-left: 6px; font-weight: 700;
    }

    .empty-tab {
      padding: 40px 20px; text-align: center; color: var(--text-muted);
      background: #f9fafb; border-radius: 12px; border: 1px dashed var(--border);
    }
    .empty-tab svg { margin-bottom: 12px; opacity: 0.4; }
    .empty-tab h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
    .empty-tab p { font-size: 12px; }
  `]
})
export class TrabModalDetailComponent {

  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  @Input({ required: true }) trabajador!: Trabajador;
  @Input() asignaciones: any[] = [];
  @Input() formaciones: any[] = [];
  @Input() documentos: any[] = [];
  @Input() tiposDoc: {id: number, tipo: string}[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<number>();

  // Eventos de gestión documental
  @Output() viewDoc = new EventEmitter<any>();
  @Output() downloadDoc = new EventEmitter<any>();
  @Output() deleteDoc = new EventEmitter<any>();
  @Output() uploadNewDoc = new EventEmitter<any>();
  @Output() updateDoc = new EventEmitter<any>();

  // ── Tabs ───────────────────────────────────────────────────────────────────
  activeTab = signal<'datos' | 'asignaciones' | 'formaciones' | 'documentos'>('datos');

  // ── Plantillas disponibles ──────────────────────────
  plantillas = [
    { id: 'contrato', nombre: 'Contrato Laboral (Estándar)' },
    { id: 'nda', nombre: 'Contrato de Confidencialidad (NDA)' },
    { id: 'autorizacion_datos', nombre: 'Autorización Tratamiento de Datos' }
  ];

  // ── Estado del formulario unificado de agregar ─────────────────────────────
  newDocSelection = '';
  isDocDropdownOpen = false;
  newDocDesc = '';
  newDocFile: File | null = null;

  get isSelectedPlantilla(): boolean { return this.newDocSelection.startsWith('plantilla:'); }
  get isSelectedManual(): boolean { return this.newDocSelection.startsWith('manual:'); }

  get selectedDocName(): string {
    if (!this.newDocSelection) return 'Selecciona un documento...';
    if (this.isSelectedPlantilla) {
      const p = this.plantillas.find(x => 'plantilla:' + x.id === this.newDocSelection);
      return p ? '⚡ ' + p.nombre : '';
    } else {
      const m = this.tiposDoc.find(x => 'manual:' + x.id === this.newDocSelection);
      return m ? '📄 ' + m.tipo : '';
    }
  }

  // ── Estado de edición inline ───────────────────────────────────────────────
  editingDocId: number | null = null;
  editDocDesc = '';
  editDocFile: File | null = null;

  // ── Helpers de datos ───────────────────────────────────────────────────────
  colorFor = getColorFor;
  initials = getInitials;

  get statusLabel(): string { return this.trabajador.activo ? 'Activo' : 'De baja'; }
  get tipoLabel(): string { return this.trabajador.freelance ? 'Freelance' : 'Plantilla'; }

  get totalFormaciones(): number { return this.formaciones.length; }
  get totalAsignaciones(): number { return this.asignaciones.length; }
  get totalDocumentos(): number { return this.documentos.length; }

  // ── Métodos de navegación ──────────────────────────────────────────────────
  setTab(tab: 'datos' | 'asignaciones' | 'formaciones' | 'documentos') {
    this.activeTab.set(tab);
    this.resetDocForm();
    this.cancelEdit();
  }

  // ── Métodos para agregar documentos ────────────────────────────────────────
  onNewFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.newDocFile = file;
  }

  addDoc(): void {
    if (!this.newDocSelection) return;

    if (this.isSelectedManual) {
      if (!this.newDocFile) return;
      const tipoId = this.newDocSelection.replace('manual:', '');
      const reader = new FileReader();
      reader.readAsDataURL(this.newDocFile);
      reader.onload = () => {
        this.uploadNewDoc.emit({
          origen: 'subir',
          tipoId,
          descripcion: this.newDocDesc,
          fileName: this.newDocFile!.name,
          base64: (reader.result as string).split(',')[1]
        });
        this.resetDocForm();
      };
    } else if (this.isSelectedPlantilla) {
      const templateId = this.newDocSelection.replace('plantilla:', '');
      this.uploadNewDoc.emit({
        origen: 'plantilla',
        templateId,
        descripcion: this.newDocDesc
      });
      this.resetDocForm();
    }
  }

  private resetDocForm(): void {
    this.newDocSelection = '';
    this.isDocDropdownOpen = false;
    this.newDocDesc = '';
    this.newDocFile = null;
    const input = document.getElementById('detailFileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  // ── Métodos para edición inline ────────────────────────────────────────────
  startEdit(doc: any): void {
    this.editingDocId = doc.id;
    this.editDocDesc = doc.descripcion || '';
    this.editDocFile = null;
  }

  cancelEdit(): void {
    this.editingDocId = null;
    this.editDocDesc = '';
    this.editDocFile = null;
  }

  onEditFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.editDocFile = file;
  }

  saveEdit(doc: any): void {
    if (this.editDocFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.editDocFile);
      reader.onload = () => {
        this.updateDoc.emit({
          id: doc.id,
          descripcion: this.editDocDesc,
          fileName: this.editDocFile!.name,
          base64: (reader.result as string).split(',')[1]
        });
        this.cancelEdit();
      };
    } else {
      this.updateDoc.emit({
        id: doc.id,
        descripcion: this.editDocDesc
      });
      this.cancelEdit();
    }
  }

  // ── Helpers de formato ─────────────────────────────────────────────────────
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
