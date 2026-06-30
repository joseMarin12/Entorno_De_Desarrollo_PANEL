import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { DocFile, FirmaModalData, TipoDocLookup, PosicionFirma } from '../models/firma.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentosService extends BaseCrud<DocFile> {
  // Centralizado en la misma ruta de la rama main
  public readonly API_URL = `${environment.apiUrl}/api/trabajadores`;

  getByTrabajador(trabajadorId: number): Observable<DocFile[]> {
    // 🔄 NORMALIZADO: 'getDocumentosByTrabajador' -> 'getDocumentos'
    return this._findAll({ action: 'getDocumentos', trabajadorId });
  }

  create(documentoData: any): Observable<DocFile> {
    // 🔄 NORMALIZADO: 'createDocumento' -> 'create'
    return this._create({ action: 'create', documentoData });
  }

  update(documentoData: any): Observable<DocFile> {
    // 🔄 NORMALIZADO: 'updateDocumento' -> 'upload' (o 'update' según tu switch de n8n)
    return this._update({ action: 'upload', documentoData });
  }

  remove(documentoId: number): Observable<unknown> {
    // 🔄 NORMALIZADO: 'deleteDocumento' -> 'delete'
    return this.http.post(this.API_URL, { action: 'delete', documentoId });
  }

  getArchivo(documentoId: number): Observable<{ contenido_b64: string | null }> {
    // 🔄 NORMALIZADO: 'getDocumentoArchivo' -> 'getArchivo'
    return this.http
      .post<{ data: { contenido_b64: string | null }[] }>(this.API_URL, { action: 'getArchivo', documentoId })
      .pipe(map(res => res.data?.[0] ?? { contenido_b64: null }));
  }

  getTiposDoc(): Observable<TipoDocLookup[]> {
    // 🔄 NORMALIZADO: 'getTiposDoc' -> 'getTipos'
    return this.http
      .post<{ data: TipoDocLookup[] }>(this.API_URL, { action: 'getTipos' })
      .pipe(map(res => res.data ?? []));
  }

  enviarFirma(firmaData: FirmaModalData & { modo_firmantes?: string; email_trabajador?: string; mensaje_correo?: string; posiciones?: PosicionFirma[] }): Observable<DocFile> {
    return this._update({ action: 'enviarFirma', firmaData });
  }

  cancelarFirma(payload: { firma_id?: number; doc_id?: number }): Observable<DocFile> {
    return this._update({ action: 'cancelarFirma', firmaData: payload });
  }
}
