import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseCrud } from './base.service';
import { DocFile, FirmaModalData, TipoDocLookup, PosicionFirma } from '../models/firma.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentosService extends BaseCrud<DocFile> {
  // Apunta al webhook de Hostinger con su subdominio y slash final
  public readonly API_URL = 'https://n8n.srv1128480.hstgr.cloud/webhook/gestion-trabajadores/'; 

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
    return this.http.post(this.API_URL, { action: 'deleteDocumento', documentoId });
  }

  getArchivo(documentoId: number): Observable<{ contenido_b64: string | null }> {
    return this.http
      .post<{ data: { contenido_b64: string | null }[] }>(this.API_URL, { action: 'getDocumentoArchivo', documentoId })
      .pipe(map(res => res.data?.[0] ?? { contenido_b64: null }));
  }

  getTiposDoc(): Observable<TipoDocLookup[]> {
    return this.http
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