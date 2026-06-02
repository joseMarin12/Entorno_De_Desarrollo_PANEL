import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvService, CsvColumnDef } from './csv.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-csv-import-export',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csv-import-export.component.html',
  styles: [`
    .csv-actions {
      display: flex;
      gap: 10px;
    }
  `]
})
export class CsvImportExportComponent {
  @Input() columns: CsvColumnDef[] = [];
  @Input() rows: any[] = [];
  @Input() exportFilename: string = 'export.csv';
  @Input() templateFilename: string = 'template.csv';

  @Output() importData = new EventEmitter<any[]>();

  csvService = inject(CsvService);
  toast = inject(ToastService);

  onExport() {
    if (this.rows.length === 0) {
      this.toast.show('warning', 'No hay datos para exportar.');
      return;
    }
    this.csvService.download(this.rows, this.columns, this.exportFilename);
  }

  onDownloadTemplate() {
    this.csvService.generateTemplate(this.columns, this.templateFilename);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.csvService.parse(file).subscribe({
      next: (data) => {
        const mappedData = data.map(row => {
          const mappedRow: any = {};
          this.columns.forEach(col => {
            const rawValue = row[col.header];
            if (rawValue !== undefined) {
              mappedRow[col.key] = this.parseImportedValue(rawValue, col.type);
            }
          });
          return mappedRow;
        });

        this.importData.emit(mappedData);
        event.target.value = ''; // Resetear el input file
      },
      error: (error) => {
        console.error('Error parsing file:', error);
        this.toast.show('error', 'Error al procesar el archivo. Asegúrate de que es un archivo válido.');
        event.target.value = ''; // Resetear el input file
      }
    });
  }

  private parseImportedValue(value: any, type?: 'text' | 'number' | 'boolean' | 'date'): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (type === 'boolean') {
      return value === true || value === 'true' || value === 'TRUE' || value === '1' || value === 1 || value === 'Yes' || value === 'yes';
    }

    if (type === 'number') {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : null;
    }

    if (type === 'date') {
      const stringValue = String(value);
      if (stringValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return stringValue.split('T')[0];
      }
      return stringValue;
    }

    return String(value);
  }
}
