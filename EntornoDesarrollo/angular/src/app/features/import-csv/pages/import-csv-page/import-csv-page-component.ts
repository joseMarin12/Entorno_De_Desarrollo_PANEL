import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../../../shared/topbar/topbar.component';

@Component({
  selector: 'app-import-csv-page',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  templateUrl: './import-csv-page-component.html',
  styleUrls: ['./import-csv-page-component.css']
})
export class ImportCsvPageComponent {
  isDragging = false;
  selectedFile: File | null = null; // Guardará el archivo capturado

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
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  private handleFiles(files: FileList): void {
    const file = files[0];
    // Validamos que sea un CSV por seguridad
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      this.selectedFile = file; // Guardamos el archivo para que el HTML reaccione
    } else {
      alert('Por favor, selecciona un archivo CSV válido.');
    }
  }

  // Acción del botón Guardar
  guardarArchivo(): void {
    if (this.selectedFile) {
      alert(`Acción simulada: Enviando ${this.selectedFile.name} al servidor backend de Laravel.`);
      // Aquí se conectará el servicio HTTP en el futuro
    }
  }

  // Acción del botón Cancelar
  cancelarSeleccion(): void {
    this.selectedFile = null; // Limpiamos la pantalla y vuelve al estado inicial
  }
}