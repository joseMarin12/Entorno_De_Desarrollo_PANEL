import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../models/empresa.model';
import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { Comercial, comercialFullName } from '../../../../models/comercial.model';
import { first, firstValueFrom } from 'rxjs';
import { TipoEmpresa } from '../../../../models/tipo-empresa.model';

@Component({
  selector: 'app-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})
export class ModalAddComponent implements OnInit {
  @Output() save  = new EventEmitter<Omit<Empresa, 'id'>>();
  @Output() close = new EventEmitter<void>();

  private comercialesApi = inject(ComercialesApiService);
  private empresasApi = inject(EmpresasApiService);

  private _tipos = signal<TipoEmpresa[]>([]);
  private _comerciales = signal<Comercial[]>([]);

  readonly comerciales = this._comerciales.asReadonly();
  readonly tipos = this._tipos.asReadonly();

  form = { nombre: '', razonSocial: '', cif: '', id_tipo_empresa: null as number | null, direcciones: 0, contactos: 0, id_comercial: null as number | null, activo: true };
  errors: Record<string, string> = {};

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  async ngOnInit(): Promise<void> {
    await Promise.allSettled([
      firstValueFrom(this.comercialesApi.findAll('', 'activo'))
        .then(page => this._comerciales.set(page.data))
        .catch(() => console.warn('No se pudieron cargar los comerciales')),

      firstValueFrom(this.empresasApi.findTipos())
        .then(tipos => { 
          console.log('Tipos de empresa cargados:', tipos);
          this._tipos.set(tipos); 
        })
        .catch((err) => console.error('No se pudieron cargar los tipos:', err)),
    ]);
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.razonSocial) this.errors['razonSocial'] = 'Campo obligatorio';
    if (!this.form.id_tipo_empresa) this.errors['id_tipo_empresa'] = 'Campo obligatorio';
    if (!this.form.cif) this.errors['cif'] = 'Campo obligatorio';
    if (Object.keys(this.errors).length > 0) return;

    const data: Omit<Empresa, 'id'> = {
      nombre: this.form.nombre,
      razonSocial: this.form.razonSocial,
      cif: this.form.cif,
      id_tipo_empresa: this.form.id_tipo_empresa!,
      id_comercial: this.form.id_comercial,
      direcciones: this.form.direcciones,
      contactos: this.form.contactos,
      activo: this.form.activo,
    };

    this.save.emit(data);
    this.reset();
  }

  reset(): void {
    this.form = { nombre: '', razonSocial: '', id_tipo_empresa: null, cif: '', direcciones: 0, contactos: 0, id_comercial: null, activo: true };
    this.errors = {};
  }

  fullName(c: Comercial): string {
    return comercialFullName(c);
  }

}
