import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../models/empresa.model';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { Comercial, comercialFullName } from '../../../../models/comercial.model';
import { TipoEmpresa } from '../../../../models/tipo-empresa.model';
import { forkJoin, of, catchError, map } from 'rxjs';

@Component({
  selector: 'app-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',
})
export class ModalEditComponent implements OnChanges, OnInit {
  @Input() empresa: Empresa | null = null;
  @Input() existingCIFs: string[] = [];
  @Output() save  = new EventEmitter<Empresa>();
  @Output() close = new EventEmitter<void>();

  private comercialesApi = inject(ComercialesApiService);
  private empresasApi = inject(EmpresasApiService);
  private formInitialized = false;
  private _tipos = signal<TipoEmpresa[]>([]);
  private _comerciales = signal<Comercial[]>([]);

  readonly comerciales = this._comerciales.asReadonly();
  readonly tipos = this._tipos.asReadonly();

  form = { nombre: '', razonSocial: '', cif: '', id_tipo_empresa: null as number | null, direcciones: 0, contactos: 0, id_comerciales: null as number | null, activo: true };
  errors: Record<string, string> = {};

  private fillForm(): void {
    if (!this.empresa) return;
    this.form = {
      nombre:          this.empresa.nombre,
      razonSocial:     this.empresa.razonSocial,
      cif:             this.empresa.cif,
      id_tipo_empresa: this.empresa.id_tipo_empresa ?? null,
      direcciones:     this.empresa.direcciones,
      contactos:       this.empresa.contactos,
      id_comerciales:    this.empresa.id_comerciales ?? null,
      activo:          this.empresa.activo,
    };
      this.errors = {};
      this.formInitialized = true;
  }

  ngOnInit(): void {
      forkJoin({
        tipos: this.empresasApi.findTipos().pipe(
          catchError((err) => {
            console.error('Error al cargar tipos:', err);
            return of([]);
          })
        ),
        comerciales: this.comercialesApi.findAll('', 'true').pipe(
          map(response => response.data ?? []),
          catchError((err) => {
            console.error('Error al cargar comerciales:', err);
            return of([]);
          })
        )
      }).subscribe(({ tipos, comerciales }) => {
      this._tipos.set(tipos);
      this._comerciales.set(comerciales);
      if (!this.formInitialized) this.fillForm();
    });
  }

  ngOnChanges(): void {
    if (!this.formInitialized) {
      this.fillForm();
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
    else if (!this.form.cif || !/^[A-Z]\d{8}$/.test(this.form.cif.trim())) {
      this.errors['cif'] = 'Introduce un CIF válido';
    }
    else if (this.existingCIFs.includes(this.form.cif.trim().toUpperCase())) {
      this.errors['cif'] = 'Este CIF ya está registrado';
    }
  
    if (Object.keys(this.errors).length > 0) return;
    this.save.emit({ id: this.empresa!.id, ...this.form, id_tipo_empresa: this.form.id_tipo_empresa!, });
  }

  fullName(c: Comercial): string {
    return comercialFullName(c);
  }
}
