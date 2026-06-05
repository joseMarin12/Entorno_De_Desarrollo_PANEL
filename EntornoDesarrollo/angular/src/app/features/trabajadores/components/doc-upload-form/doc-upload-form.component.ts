import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../services/toast.service';
import { TipoDocLookup } from '../../../../models/firma.model';

export interface NuevoDocumento {
  tipoId: string;
  descripcion: string;
  requiereFirma: boolean;
  file: File;
  base64: string;
}

@Component({
  selector: 'app-doc-upload-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="duf-card">

      <div class="duf-row">
        <div class="form-group duf-tipo">
          <label class="form-label duf-label">¿Qué documento añadirás? <em style="color:var(--danger)">*</em></label>

          <div
            class="form-input duf-trigger"
            [class.error]="docErrors['tipo']"
            [style.borderColor]="isDropdownOpen ? 'var(--blue-mid)' : ''"
            (click)="isDropdownOpen = !isDropdownOpen">
            <span class="duf-trigger-text" [style.color]="selection ? 'var(--text)' : 'var(--text-muted)'">{{ selectedName }}</span>
            <svg class="duf-chevron" [style.transform]="isDropdownOpen ? 'rotate(180deg)' : 'none'"
                 width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          @if (isDropdownOpen) {
            <div class="duf-backdrop" (click)="isDropdownOpen = false"></div>
            <div class="duf-menu">
              <div class="duf-menu-title">📄 Tipo de documento</div>
              @for (t of tiposDoc; track t.id) {
                <div class="doc-type-option" (click)="selectTipo(t.id)">{{ t.tipo }}</div>
              }
            </div>
          }
          @if (docErrors['tipo']) { <span class="form-hint error-msg">{{ docErrors['tipo'] }}</span> }
        </div>

        <!-- Descripción -->
        <div class="form-group duf-desc">
          <label class="form-label duf-label">Descripción (Opcional)</label>
          <input class="form-input duf-input" type="text" placeholder="Añade una nota o detalle sobre este documento..." [(ngModel)]="descripcion" />
        </div>
      </div>

      <div class="duf-zone-wrap">
        <div class="doc-dropzone" [class.is-success]="file" [class.is-error]="docErrors['archivo']" (click)="fileInput.click()">
          <div class="doc-dropzone-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          @if (file) {
            <span class="duf-file-name">{{ file.name }}</span>
            <span class="duf-file-hint">Click para cambiar el archivo</span>
          } @else {
            <span class="duf-file-name">Haz clic para seleccionar el archivo</span>
            <span class="duf-file-hint">PDF, PNG o JPG (Máx. 5MB)</span>
          }
          <input #fileInput type="file" hidden (change)="onFileSelected($event)" accept="image/jpeg,image/png,application/pdf" />
        </div>
        @if (docErrors['archivo']) { <span class="form-hint error-msg">{{ docErrors['archivo'] }}</span> }

        <div class="firma-toggle-row" [class.on]="requiereFirma">
          <div class="firma-toggle-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
              <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
          <div class="firma-toggle-text">
            <div class="firma-toggle-title">Este documento requiere firma electrónica</div>
            <div class="firma-toggle-desc">Quedará pendiente de firma para gestionarlo desde el detalle del trabajador.</div>
          </div>
          <div class="toggle-switch" [class.on]="requiereFirma" (click)="requiereFirma = !requiereFirma"></div>
        </div>

        <div class="duf-actions">
          <button type="button" class="btn btn-primary duf-btn" (click)="agregar()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Agregar documento
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .duf-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 12px;
      padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .duf-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .duf-tipo { margin: 0; position: relative; flex: 1; min-width: 250px; }
    .duf-desc { margin: 0; flex: 1.5; min-width: 250px; }
    .duf-label { font-size: 13px; font-weight: 600; }
    .duf-input, .duf-trigger { padding: 12px 14px; height: auto; font-size: 14px; }

    .duf-trigger {
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; user-select: none; overflow: hidden;
    }
    .duf-trigger-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 12px; flex-grow: 1; }
    .duf-chevron { flex-shrink: 0; transition: transform 0.2s; color: var(--text-muted); }

    .duf-backdrop { position: fixed; inset: 0; z-index: 99; }
    .duf-menu {
      position: absolute; top: calc(100% + 4px); left: 0; width: 100%; max-height: 250px;
      overflow-y: auto; background: var(--card); border: 1px solid var(--border);
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; padding: 8px 0;
    }
    .duf-menu-title {
      padding: 6px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;
      color: var(--text-muted); background: #f8f9fd; margin-bottom: 4px;
    }
    .doc-type-option {
      padding: 10px 16px; font-size: 13px; cursor: pointer;
      color: var(--text); transition: background 0.1s;
    }
    .doc-type-option:hover { background: #f3f4f6; }

    .duf-zone-wrap { display: flex; flex-direction: column; gap: 16px; }

    /* Zona de subida: estados normal / éxito (archivo elegido) / error (validación) */
    .doc-dropzone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 24px; border: 2px dashed #e2e8f0; border-radius: 10px;
      background: #f8fafc; cursor: pointer; transition: all 0.25s ease;
    }
    .doc-dropzone:hover { border-color: #cbd5e1; background: #f1f5f9; }
    .doc-dropzone.is-success { border-style: solid; border-color: #9bd9b8; background: #eef9f2; }
    .doc-dropzone.is-success:hover { border-color: #7cc59e; background: #e4f4ea; }
    .doc-dropzone.is-error { border-style: solid; border-color: #eca9a1; background: #fdecea; }
    .doc-dropzone.is-error:hover { border-color: #e08c81; background: #fbe0dc; }
    .doc-dropzone-icon {
      width: 48px; height: 48px; background: #fff; border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: #64748b;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px; transition: color 0.25s ease;
    }
    .doc-dropzone.is-success .doc-dropzone-icon { color: #1a7a45; }
    .doc-dropzone.is-error .doc-dropzone-icon { color: #b71c1c; }
    .duf-file-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .duf-file-hint { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    /* Toggle "requiere firma electrónica" */
    .firma-toggle-row {
      display: flex; align-items: center; gap: 14px; padding: 12px 16px;
      border-radius: 10px; border: 1px solid var(--border); background: #fafbff; transition: all 0.2s;
    }
    .firma-toggle-row.on { background: #f5f3ff; border-color: #c4b5fd; }
    .firma-toggle-icon {
      width: 36px; height: 36px; border-radius: 10px; background: #ede9fe; color: var(--purple-dark);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s;
    }
    .firma-toggle-row.on .firma-toggle-icon { background: var(--purple-dark); color: #fff; }
    .firma-toggle-text { flex: 1; }
    .firma-toggle-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .firma-toggle-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .toggle-switch {
      position: relative; width: 40px; height: 22px; background: #d1d5db;
      border-radius: 11px; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
    }
    .toggle-switch.on { background: var(--purple-dark); }
    .toggle-switch::after {
      content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
      background: #fff; border-radius: 50%; transition: left 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .toggle-switch.on::after { left: 20px; }

    .duf-actions { display: flex; justify-content: flex-end; }
    .duf-btn { padding: 10px 24px; font-weight: 600; border-radius: 8px; }
  `]
})
export class DocUploadFormComponent {
  private toast = inject(ToastService);

  @Input() tiposDoc: TipoDocLookup[] = [];
  @Input() maxReached = false;

  @Output() add = new EventEmitter<NuevoDocumento>();

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  selection = '';
  isDropdownOpen = false;
  descripcion = '';
  file: File | null = null;
  requiereFirma = false;
  docErrors: Record<string, string> = {};

  get isSelectedManual(): boolean { return this.selection.startsWith('manual:'); }

  get selectedName(): string {
    if (!this.selection) return 'Selecciona un documento...';
    const m = this.tiposDoc.find(x => 'manual:' + x.id === this.selection);
    return m ? '📄 ' + m.tipo : '';
  }

  selectTipo(id: number): void {
    this.selection = 'manual:' + id;
    delete this.docErrors['tipo'];
    this.isDropdownOpen = false;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.toast.show('warning', 'Formato no permitido. Sube PDF, JPG o PNG.');
      this.reset();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.show('warning', 'El archivo supera el límite de 5MB.');
      this.reset();
      return;
    }

    this.file = file;
    delete this.docErrors['archivo'];
  }

  agregar(): void {
    if (this.maxReached) {
      this.toast.show('warning', 'Límite de documentos alcanzado.');
      return;
    }

    this.docErrors = {};
    if (!this.isSelectedManual) this.docErrors['tipo'] = 'Selecciona el tipo de documento.';
    if (!this.file) this.docErrors['archivo'] = 'Selecciona un archivo a subir.';
    if (Object.keys(this.docErrors).length > 0) {
      this.toast.show('warning', 'Hay campos con errores. Por favor, revisa las alertas en rojo.');
      return;
    }

    const file = this.file!;
    const tipoId = this.selection.replace('manual:', '');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.add.emit({
        tipoId,
        descripcion: this.descripcion,
        requiereFirma: this.requiereFirma,
        file,
        base64: reader.result as string,
      });
      this.reset();
    };
  }

  private reset(): void {
    this.selection = '';
    this.descripcion = '';
    this.file = null;
    this.requiereFirma = false;
    this.docErrors = {};
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }
}
