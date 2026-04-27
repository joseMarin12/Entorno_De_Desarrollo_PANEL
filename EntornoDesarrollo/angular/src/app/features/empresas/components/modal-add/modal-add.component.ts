import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empresa } from '../../../../models/empresa.model';
import { ComercialesApiService } from '../../../../services/comerciales-api.service';
import { EmpresasApiService } from '../../../../services/empresas-api.service';
import { Comercial, comercialFullName } from '../../../../models/comercial.model';
import { catchError, of, forkJoin, map } from 'rxjs';
import { TipoEmpresa } from '../../../../models/tipo-empresa.model';

@Component({
  selector: 'app-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})
export class ModalAddComponent implements OnInit {
  @Input() existingCIFs: string[] = [];
  @Output() save  = new EventEmitter<Omit<Empresa, 'id'>>();
  @Output() close = new EventEmitter<void>();

  private comercialesApi = inject(ComercialesApiService);
  private empresasApi = inject(EmpresasApiService);

  private _tipos = signal<TipoEmpresa[]>([]);
  private _comerciales = signal<Comercial[]>([]);

  readonly comerciales = this._comerciales.asReadonly();
  readonly tipos = this._tipos.asReadonly();

  form = { nombre: '', razonSocial: '', cif: '', id_tipo_empresa: null as number | null, direcciones: 0, contactos: 0, id_comerciales: null as number | null, activo: true };
  errors: Record<string, string> = {};

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  ngOnInit(): void {
    forkJoin({
      tipos: this.empresasApi.findTipos().pipe(
        catchError((err) => {
          console.error('Error al cargar tipos:', err);
          return of([]);
        })
      ),
      comerciales: this.comercialesApi.findAll(1, 1000, '', 'true').pipe(
        map(response => response.data ?? []),
        catchError((err) => {
          console.error('Error al cargar comerciales:', err);
          return of([]);
        })
      )
    }).subscribe(({ tipos, comerciales }) => {
    this._tipos.set(tipos);
    this._comerciales.set(comerciales);
  });
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

    const data: Omit<Empresa, 'id'> = {
      nombre: this.form.nombre,
      razonSocial: this.form.razonSocial,
      cif: this.form.cif,
      id_tipo_empresa: this.form.id_tipo_empresa!,
      id_comerciales: this.form.id_comerciales,
      direcciones: this.form.direcciones,
      contactos: this.form.contactos,
      activo: this.form.activo,
    };

    this.save.emit(data);
    this.reset();
  }

  reset(): void {
    this.form = { nombre: '', razonSocial: '', id_tipo_empresa: null, cif: '', direcciones: 0, contactos: 0, id_comerciales: null, activo: true };
    this.errors = {};
  }

  fullName(c: Comercial): string {
    return comercialFullName(c);
  }

}
