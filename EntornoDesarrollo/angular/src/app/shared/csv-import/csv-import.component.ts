import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, firstValueFrom } from 'rxjs';

export interface CsvColumnDef {
  key: string;
  label: string;
  required?: boolean;
  /** Explicación breve de qué valor va en esta columna (formato, valores válidos...), mostrada en el icono de ayuda. */
  hint?: string;
}

export interface CsvImportRowOutcome {
  note?: string;
  /** Valor exacto a copiar al portapapeles (p. ej. la contraseña temporal sin el texto explicativo del note). */
  secret?: string;
}

interface CsvRowError {
  row: number;
  label: string;
  message: string;
}

interface CsvRowNote {
  row: number;
  label: string;
  note: string;
  secret?: string;
}

type CsvImportState = 'idle' | 'loaded' | 'processing' | 'done';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csv-import.component.html',
  styleUrl: './csv-import.component.scss',
})
export class CsvImportComponent {
  /** Cabeceras esperadas en el CSV para este módulo. Si se deja vacío, el botón solo muestra el modal visual (sin importar nada). */
  @Input() columns: CsvColumnDef[] = [];
  /** Crea un registro a partir de una fila ya parseada. Debe devolver un Observable que complete al guardar o falle con un Error legible. */
  @Input() importRow: ((row: Record<string, string>) => Observable<CsvImportRowOutcome | void>) | null = null;
  /** Texto identificativo de una fila, usado en los mensajes de error/resumen. */
  @Input() rowLabel: (row: Record<string, string>) => string = () => '';
  /** Se emite cuando termina el proceso de importación (con o sin errores), para que la página recargue la tabla. */
  @Output() imported = new EventEmitter<void>();

  showModal = signal(false);
  isDragging = signal(false);
  fileName = signal<string | null>(null);
  state = signal<CsvImportState>('idle');
  parseError = signal<string | null>(null);

  totalRows = signal(0);
  processedRows = signal(0);
  successCount = signal(0);
  errors = signal<CsvRowError[]>([]);
  notes = signal<CsvRowNote[]>([]);

  showInfo = signal(false);
  showCloseConfirm = signal(false);
  copiedRow = signal<number | null>(null);

  private pendingFile: File | null = null;

  get columnsHint(): string {
    return this.columns.map(c => c.label).join(', ');
  }

  toggleInfo(event: Event): void {
    event.stopPropagation();
    this.showInfo.update(v => !v);
  }

  @HostListener('document:click')
  closeInfo(): void {
    this.showInfo.set(false);
  }

  open(): void {
    this.showModal.set(true);
  }

  close(): void {
    if (this.state() === 'processing') return;
    if (this.state() === 'done' && this.notes().length > 0 && !this.showCloseConfirm()) {
      this.showCloseConfirm.set(true);
      return;
    }
    this.showCloseConfirm.set(false);
    this.showModal.set(false);
    this.reset();
  }

  cancelCloseConfirm(event: Event): void {
    event.stopPropagation();
    this.showCloseConfirm.set(false);
  }

  confirmCloseAnyway(event: Event): void {
    event.stopPropagation();
    this.showModal.set(false);
    this.reset();
  }

  async copyNote(row: CsvRowNote, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(row.secret ?? row.note);
      this.copiedRow.set(row.row);
      setTimeout(() => this.copiedRow.set(null), 1500);
    } catch { /* portapapeles no disponible */ }
  }

  async copyAllNotes(event: Event): Promise<void> {
    event.stopPropagation();
    const text = this.notes().map(n => `${n.label}: ${n.secret ?? n.note}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.copiedRow.set(-1);
      setTimeout(() => this.copiedRow.set(null), 1500);
    } catch { /* portapapeles no disponible */ }
  }

  private reset(): void {
    this.isDragging.set(false);
    this.fileName.set(null);
    this.state.set('idle');
    this.parseError.set(null);
    this.totalRows.set(0);
    this.processedRows.set(0);
    this.successCount.set(0);
    this.errors.set([]);
    this.notes.set([]);
    this.showCloseConfirm.set(false);
    this.copiedRow.set(null);
    this.pendingFile = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
    input.value = '';
  }

  private setFile(file: File): void {
    this.fileName.set(file.name);
    this.pendingFile = file;
    this.parseError.set(null);
    this.state.set('loaded');
  }

  cancelFile(): void {
    this.reset();
  }

  async confirmImport(): Promise<void> {
    const file = this.pendingFile;
    if (!file) return;

    if (!this.importRow) {
      this.close();
      return;
    }

    const text = await file.text();
    const table = this.parseCsv(text);

    if (table.length < 2) {
      this.parseError.set('El archivo no contiene filas de datos.');
      return;
    }

    const headers = table[0].map(h => this.normalizeHeader(h));
    const missingCols = this.columns.filter(c => c.required && !headers.includes(c.key));
    if (missingCols.length > 0) {
      this.parseError.set(`Faltan columnas obligatorias: ${missingCols.map(m => m.label).join(', ')}.`);
      return;
    }

    const dataRows = table.slice(1).filter(r => r.some(cell => cell.trim() !== ''));
    if (dataRows.length === 0) {
      this.parseError.set('El archivo no contiene filas de datos.');
      return;
    }

    this.parseError.set(null);
    this.totalRows.set(dataRows.length);
    this.processedRows.set(0);
    this.successCount.set(0);
    this.errors.set([]);
    this.notes.set([]);
    this.state.set('processing');

    for (let i = 0; i < dataRows.length; i++) {
      const rowNumber = i + 2; // la fila 1 del CSV es la cabecera
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => row[h] = (dataRows[i][idx] ?? '').trim());
      const label = this.rowLabel(row) || `Fila ${rowNumber}`;

      const missingField = this.columns.find(c => c.required && !row[c.key]);
      if (missingField) {
        this.errors.update(list => [...list, { row: rowNumber, label, message: `Falta el campo obligatorio "${missingField.label}"` }]);
        this.processedRows.update(n => n + 1);
        continue;
      }

      try {
        const outcome = await firstValueFrom(this.importRow(row));
        this.successCount.update(n => n + 1);
        if (outcome?.note) {
          this.notes.update(list => [...list, { row: rowNumber, label, note: outcome.note!, secret: outcome.secret }]);
        }
      } catch (e: any) {
        const message = e?.message || 'No se pudo importar la fila';
        this.errors.update(list => [...list, { row: rowNumber, label, message }]);
      }
      this.processedRows.update(n => n + 1);
    }

    this.state.set('done');
    this.imported.emit();
  }

  private normalizeHeader(h: string): string {
    return h
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  private parseCsv(text: string): string[][] {
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const delimiter = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => { pushField(); rows.push(row); row = []; };

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === delimiter) pushField();
        else if (c === '\r') { /* se ignora, el salto real llega con \n */ }
        else if (c === '\n') pushRow();
        else field += c;
      }
    }
    if (field.length > 0 || row.length > 0) pushRow();

    return rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
  }
}
