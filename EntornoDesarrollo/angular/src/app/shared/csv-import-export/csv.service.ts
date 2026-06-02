import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';

export interface CsvColumnDef {
  key: string;
  header: string;
  required?: boolean;
  type?: 'text' | 'number' | 'boolean' | 'date';
}

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  private toCsvString(data: any[], columns: CsvColumnDef[]): string {
    const headers = columns.map(col => this.escapeCsvValue(col.header)).join(',');
    const rows = data.map(row =>
      columns.map(col => this.escapeCsvValue(this.formatValueForExport(row[col.key], col.type))).join(',')
    );
    return [headers, ...rows].join('\n');
  }

  private formatValueForExport(value: any, type?: 'text' | 'number' | 'boolean' | 'date'): any {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (type === 'boolean') {
      return value === true || value === 'true' || value === 1 || value === '1' ? '1' : '0';
    }

    if (type === 'number') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : '';
    }

    if (type === 'date') {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      const stringValue = String(value);
      if (stringValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return stringValue.split('T')[0];
      }
      return stringValue;
    }

    return String(value);
  }

  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private downloadFile(content: string, filename: string): void {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  parse(file: File): Observable<Record<string, any>[]> {
    return new Observable<Record<string, any>[]>(observer => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';

          if (isCsv) {
            observer.next(this.parseCsvText(result as string));
            observer.complete();
            return;
          }

          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          observer.next(json);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      };
      reader.onerror = (error) => observer.error(error);

      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  private parseCsvText(csvText: string): Record<string, any>[] {
    const rows: string[][] = [];
    let current = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
        continue;
      }

      current += char;
    }

    if (current !== '' || row.length > 0) {
      row.push(current);
      rows.push(row);
    }

    const [headerRow, ...dataRows] = rows.filter(r => r.length > 0);
    if (!headerRow) {
      return [];
    }

    const headers = headerRow.map(header => header.trim());
    return dataRows
      .filter(r => r.some(cell => cell.trim() !== ''))
      .map(rowData => {
        const record: Record<string, any> = {};
        headers.forEach((header, index) => {
          record[header] = rowData[index] ?? '';
        });
        return record;
      });
  }

  download(rows: any[], columns: CsvColumnDef[], filename: string): void {
    const csvContent = this.toCsvString(rows, columns);
    this.downloadFile(csvContent, filename);
  }

  generateTemplate(columns: CsvColumnDef[], filename: string): void {
    const exampleRow: Record<string, any> = {};
    columns.forEach(col => {
      switch (col.type) {
        case 'number':  exampleRow[col.key] = ''; break;
        case 'boolean': exampleRow[col.key] = ''; break;
        case 'date':    exampleRow[col.key] = ''; break;
        default:        exampleRow[col.key] = ''; break;
      }
    });
    const csvContent = this.toCsvString([exampleRow], columns);
    this.downloadFile(csvContent, filename);
  }
}
