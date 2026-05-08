import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentoFirma } from '../../../models/documento-firma.model';

@Injectable({
  providedIn: 'root'
})
export class FirmasApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/documentos-firma`;

  /**
   * Obtiene todos los documentos asociados a un trabajador específico
   */
  getByTrabajador(trabajadorId: number): Observable<DocumentoFirma[]> {
    return this.http.get<DocumentoFirma[]>(`${this.apiUrl}/trabajador/${trabajadorId}`);
  }

  /**
   * Dispara el proceso de solicitud de firma para un documento ya existente
   */
  solicitarFirma(documentoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${documentoId}/solicitar-firma`, {});
  }

  /**
   * Envía la solicitud completa (con payload) hacia el proxy de Laravel
   */
  solicitarFirmaCompleta(payload: any): Observable<any> {
    // Si el documento es dummy (999), enviamos a una ruta genérica de prueba o al webhook directamente, 
    // pero para probar la estructura completa enviamos a una ruta de Laravel
    return this.http.post(`${this.apiUrl}/solicitar-firma-proxy`, payload);
  }
}
