import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-import-csv-modal', // <- Cambiamos el selector a modal
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-csv-page-component.html',
  styleUrls: ['./import-csv-page-component.css']
})
export class ImportCsvModalComponent {
  private http = inject(HttpClient);

  // Inputs y Outputs para controlar el modal desde fuera
  @Input() isOpen = false;
  @Input() endpointUrl = 'http://localhost:8000/api/importar-csv'; // URL por defecto
  @Output() close = new EventEmitter<void>();
  @Output() importSuccess = new EventEmitter<any>();

  isDragging = false;
  selectedFile: File | null = null;
  cargando = false;
  mensajeServidor = '';

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) { this.handleFiles(files); }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) { this.handleFiles(files); }
  }

  private handleFiles(files: FileList): void {
    const file = files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      this.selectedFile = file;
      this.mensajeServidor = '';
    } else {
      alert('Por favor, selecciona un archivo CSV válido.');
    }
  }

  guardarArchivo(): void {
    if (!this.selectedFile) return;
    this.cargando = true;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>(this.endpointUrl, formData).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.mensajeServidor = `✅ Archivo procesado con éxito.`;
        this.importSuccess.emit(respuesta); // Avisamos al componente padre de que todo ha ido genial
        setTimeout(() => this.cerrarModal(), 1500); // Se cierra solo tras el éxito
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeServidor = '❌ Error al procesar el archivo.';
        console.error(err);
      }
    });
  }

  cerrarModal(): void {
    this.selectedFile = null;
    this.mensajeServidor = '';
    this.close.emit(); // Lanza el evento de cierre hacia fuera
  }
}