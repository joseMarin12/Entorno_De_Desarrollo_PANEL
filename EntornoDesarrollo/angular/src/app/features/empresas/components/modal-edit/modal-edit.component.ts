import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../models/empresa.model';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { Comercial, comercialFullName } from '../../../../models/comercial.model';
import { TipoEmpresa } from '../../../../models/tipo-empresa.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',
})
export class ModalEditComponent implements OnChanges, OnInit {
  @Input() empresa: Empresa | null = null;
  @Output() save  = new EventEmitter<Empresa>();
  @Output() close = new EventEmitter<void>();

  private comercialesApi = inject(ComercialesApiService);
  private empresasApi = inject(EmpresasApiService);

  private _tipos = signal<TipoEmpresa[]>([]);
  private _comerciales = signal<Comercial[]>([]);

  readonly comerciales = this._comerciales.asReadonly();
  readonly tipos = this._tipos.asReadonly();

  form = { nombre: '', razonSocial: '', cif: '', id_tipo_empresa: null as number | null, direcciones: 0, contactos: 0, id_comercial: null as number | null, activo: true };
  errors: Record<string, string> = {};

  async ngOnInit(): Promise<void> {
    await Promise.allSettled([
      firstValueFrom(this.comercialesApi.findAll('', 'activo'))
        .then(response => this._comerciales.set(response.data ?? []))
        .catch(() => console.warn('No se pudieron cargar los comerciales')),

      firstValueFrom(this.empresasApi.findTipos())
        .then(tipos => {
          this._tipos.set(tipos);
        })
        .catch((err) => console.error('Error al cargar tipos:', err)),  // ← cambia warn por error con el err
  ]);
  }

  ngOnChanges(): void {
    if (this.empresa) {
      this.form = {
        nombre:          this.empresa.nombre,
        razonSocial:     this.empresa.razonSocial,
        cif:             this.empresa.cif,
        id_tipo_empresa: this.empresa.id_tipo_empresa,
        direcciones:     this.empresa.direcciones,
        contactos:       this.empresa.contactos,
        id_comercial:    this.empresa.id_comercial,
        activo:          this.empresa.activo,
       };
      this.errors = {};
    }
  }

  get subtitle(): string {
    if (!this.empresa) return '';
    return `Modificando datos de ${[this.empresa.nombre, this.empresa.razonSocial].join(' ')}`;
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre)    this.errors['nombre']    = 'Campo obligatorio';
    if (!this.form.razonSocial) this.errors['razonSocial'] = 'Campo obligatorio';
    if (!this.form.id_tipo_empresa) this.errors['id_tipo_empresa'] = 'Campo obligatorio';
    if (!this.form.cif) this.errors['cif'] = 'Campo obligatorio';
    if (Object.keys(this.errors).length > 0) return;

    this.save.emit({ id: this.empresa!.id, ...this.form, id_tipo_empresa: this.form.id_tipo_empresa!, });
  }

  fullName(c: Comercial): string {
    return comercialFullName(c);
  }
}
