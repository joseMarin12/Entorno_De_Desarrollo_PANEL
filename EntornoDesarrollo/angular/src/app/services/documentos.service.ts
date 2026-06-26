import { Injectable, inject } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';    
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { DocFile, FirmaModalData, TipoDocLookup, PosicionFirma } from '../models/firma.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
public class DocumentosService extends BaseCrud<DocFile> {
  
  // 🚀 EL FIX DEFINITIVO: Lo renombramos a 'httpClient' para evitar choques con la clase padre BaseCrud
  private readonly httpClient = inject(HttpClient);

  // El FIX de arquitectura: Apunta de manera segura a tu backend de Laravel
  public override readonly API_URL = `${environment.apiUrl}/api/documentos`;

  getByTrabajador(trabajadorId: number): Observable<DocFile[]> {
    return this._findAll({ action: 'getDocumentosByTrabajador', trabajadorId });
  }

  create(documentoData: any): Observable<DocFile> {
    return this._create({ action: 'createDocumento', documentoData });
  }

  update(documentoData: any): Observable<DocFile> {
    return this._update({ action: 'updateDocumento', documentoData });
  }

  remove(documentoId: number): Observable<unknown> {
    // 🚀 Usamos httpClient
    return this.httpClient.post(this.API_URL, { action: 'deleteDocumento', documentoId });
  }

  getArchivo(documentoId: number): Observable<{ contenido_b64: string | null }> {
    // 🚀 Usamos httpClient
    return this.httpClient
      .post<{ data: { contenido_b64: string | null }[] }>(this.API_URL, { action: 'getDocumentoArchivo', documentoId })
      .pipe(map(res => res.data?.[0] ?? { contenido_b64: null }));
  }

  getTiposDoc(): Observable<TipoDocLookup[]> {
    // 🚀 Usamos httpClient
    return this.httpClient
      .post<{ data: TipoDocLookup[] }>(this.API_URL, { action: 'getTiposDoc' })
      .pipe(map(res => res.data ?? []));
  }

  enviarFirma(firmaData: FirmaModalData & { modo_firmantes?: string; email_trabajador?: string; mensaje_correo?: string; posiciones?: PosicionFirma[] }): Observable<DocFile> {
    return this._update({ action: 'enviarFirma', firmaData });
  }

  cancelarFirma(payload: { firma_id?: number; doc_id?: number }): Observable<DocFile> {
    return this._update({ action: 'cancelarFirma', firmaData: payload });
  }
}
