import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirmasApiService } from '../../services/firmas-api.service';
import { DocumentoFirma } from '../../../../models/documento-firma.model';
import { TableComponent, ColumnDef, EnumBadgeOption } from '../../../../shared/table/table.component';
import { ToastService } from '../../../../services/toast.service';
import { FirmaRequestModalComponent, FirmaRequestData } from '../firma-request-modal/firma-request-modal.component';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const ESTADOS_MAP: Record<string, EnumBadgeOption> = {
  'pendiente_trabajador': { label: 'Pendiente Trabajador', background: '#fff3cd', color: '#856404' },
  'pendiente_rrhh':       { label: 'Pendiente RRHH',       background: '#cce5ff', color: '#004085' },
  'completado':           { label: 'Completado',           background: '#d4edda', color: '#155724' },
  'cancelado':            { label: 'Cancelado',            background: '#f8d7da', color: '#721c24' }
};

@Component({
  selector: 'app-firmas-table',
  standalone: true,
  imports: [CommonModule, TableComponent, FirmaRequestModalComponent],
  templateUrl: './firmas-table.component.html'
})
export class FirmasTableComponent implements OnInit {
  trabajadorId = input.required<number>();
  
  api = inject(FirmasApiService);
  toast = inject(ToastService);

  documentos = signal<DocumentoFirma[]>([]);
  showAddModal = false;

  // Configuración de las columnas de la tabla
  readonly columns: ColumnDef[] = [
    {
      header: 'Documento',
      type: 'text',
      field: 'nombre_fichero'
    },
    {
      header: 'Estado',
      type: 'enum-badge',
      field: 'estado',
      enumMap: ESTADOS_MAP
    },
    {
      header: 'Firma Trabajador',
      type: 'date',
      field: 'fecha_firma_trabajador'
    },
    {
      header: 'Firma RRHH',
      type: 'date',
      field: 'fecha_firma_rrhh'
    },
    {
      header: 'Acciones',
      type: 'actions',
      actions: [
        {
          type: 'solicitar',
          icon: 'mail',
          variant: 'edit',
          title: 'Solicitar Firma',
          showWhen: 'always',
          disabledFn: (row: DocumentoFirma) => row.estado !== 'pendiente_trabajador' && row.estado !== null && row.estado !== undefined
        },
        {
          type: 'descargar',
          icon: 'eye',
          variant: 'success',
          title: 'Ver PDF Firmado',
          showWhen: 'always',
          disabledFn: (row: DocumentoFirma) => row.estado !== 'completado'
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Para modo de prueba, si la API falla o no existe, usamos datos falsos
    this.api.getByTrabajador(this.trabajadorId()).pipe(
      catchError(() => {
        // Datos dummy para que puedas ver la tabla funcionando
        return of([
          {
            id: 1,
            nombre_fichero: 'Contrato_Juan_Perez.pdf',
            estado: 'pendiente_trabajador',
            fecha_asignacion: '2026-04-30',
            requiere_firma_rrhh: true
          },
          {
            id: 2,
            nombre_fichero: 'Acuerdo_Confidencialidad.pdf',
            estado: 'completado',
            fecha_asignacion: '2026-04-20',
            fecha_firma_trabajador: '2026-04-21T10:00:00',
            fecha_firma_rrhh: '2026-04-22T11:00:00',
            requiere_firma_rrhh: true,
            link_sharepoint: 'https://sharepoint.com/doc2'
          }
        ] as DocumentoFirma[]);
      })
    ).subscribe(data => {
      this.documentos.set(data);
    });
  }

  onActionClick(event: { type: string; id: number }): void {
    const doc = this.documentos().find(d => d.id === event.id);
    if (!doc) return;

    if (event.type === 'solicitar') {
      this.toast.show('info', `Solicitando firma para ${doc.nombre_fichero}...`);
      // Simulación de llamada
      this.api.solicitarFirma(event.id).subscribe({
        next: () => this.toast.show('success', 'Solicitud enviada a Signaturit'),
        error: () => this.toast.show('success', 'Simulación: Solicitud enviada a Signaturit (API real no conectada)')
      });
    }

    if (event.type === 'descargar') {
      if (doc.link_sharepoint) {
        window.open(doc.link_sharepoint, '_blank');
      } else {
        this.toast.show('warning', 'El enlace del documento final no está disponible.');
      }
    }
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  onSubmitRequest(data: FirmaRequestData): void {
    this.showAddModal = false;
    this.toast.show('info', 'Procesando solicitud hacia Signaturit...');
    
    // Aquí llamamos al backend enviando el payload mock.
    // Usaremos un documento con ID 999 para la simulación
    const payload = {
      action: 'solicitarFirma',
      documento_id: 999, // Simulamos un documento recién creado
      url_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // PDF público
      trabajador_nombre: data.trabajador_nombre,
      trabajador_email: data.trabajador_email,
      requiere_rrhh: data.requiere_rrhh,
      rrhh_email: 'rrhh@sgtech.tech',
      documento_nombre: data.documento_nombre
    };

    // Al API temporal le pasamos este objeto complejo
    this.api.solicitarFirmaCompleta(payload).subscribe({
      next: () => {
        this.toast.show('success', '¡Solicitud de firma enviada con éxito!');
        // Añadimos el doc mock a la tabla visualmente
        this.documentos.update(docs => [{
          id: 999,
          nombre_fichero: data.documento_nombre,
          estado: 'pendiente_trabajador',
          fecha_asignacion: new Date().toISOString().split('T')[0],
          requiere_firma_rrhh: data.requiere_rrhh
        }, ...docs]);
      },
      error: () => this.toast.show('error', 'Error al comunicar con el backend')
    });
  }
}
