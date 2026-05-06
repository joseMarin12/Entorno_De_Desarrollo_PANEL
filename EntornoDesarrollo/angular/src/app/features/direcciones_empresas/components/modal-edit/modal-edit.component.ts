import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DireccionEmpresa } from "../../../../models/direccion-empresa.model";
import { EmpresasApiService } from "../../../../services/empresas-api.service";
import { DireccionesEmpresasApiService } from "../../../../services/direcciones-empresas-api.service";
import { Pais } from "../../../../models/pais.model";
import { catchError, forkJoin, of } from "rxjs";
import { Provincia } from "../../../../models/provincia.model";
import { Localidad } from "../../../../models/localidad.model";

@Component({
  selector: 'app-modal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit.component.html',    
})
export class ModalEditComponent {
  @Input() dirEmpresa: DireccionEmpresa | null = null;
  @Output() save  = new EventEmitter<DireccionEmpresa>();
  @Output() close = new EventEmitter<void>();

  private direccionesApi = inject(DireccionesEmpresasApiService);
 

  private _paises = signal<Pais[]>([]);
  private _provincias = signal<Provincia[]>([]);
  private _localidades = signal<Localidad[]>([]);

  readonly paises = this._paises.asReadonly();
  readonly provincias = this._provincias.asReadonly();
  readonly localidades = this._localidades.asReadonly();

  selectedPaisId: number | null = null;
  selectedProvinciaId: number | null = null;

  form = { direccion: '', codigoPostal: '', id_localidad: null as number | null, id_empresa: null as number | null, activo: true };
  errors: Record<string, string> = {};

  private formInitialized = false;

  private fillForm(): void {
    if (!this.dirEmpresa || this._paises().length === 0) return;

    this.selectedPaisId = this.dirEmpresa.id_pais;
    this.selectedProvinciaId = this.dirEmpresa.id_provincia;

    this.form = {
      direccion:    this.dirEmpresa.direccion,
      codigoPostal: this.dirEmpresa.codigoPostal,
      id_localidad: this.dirEmpresa.id_localidad,
      id_empresa:   this.dirEmpresa.id_empresa,
      activo:       this.dirEmpresa.activo,
    };
      this.errors = {};
      this.formInitialized = true;

    forkJoin({
      provincias: this.direccionesApi.findProvincias(this.dirEmpresa.id_pais),
      localidades: this.direccionesApi.findLocalidades(this.dirEmpresa.id_provincia),
    }).subscribe({
      next: ({ provincias, localidades }) => {
        this._provincias.set(provincias);
        this._localidades.set(localidades);
      },
      error: (err) => console.error('Error al cargar provincias/localidades:', err),
    });
  }

  ngOnInit(): void {
    this.direccionesApi.findPaises().subscribe({
      next: (paises) => {
        this._paises.set(paises);
        if (!this.formInitialized) this.fillForm();
      },
      error: (err) => console.error('Error al cargar países:', err),
    });
  }

  ngOnChanges(): void {
    this.formInitialized = false;
    this.fillForm();
  }

  onPaisChange(idPais: number): void {
    this.selectedProvinciaId = null;
    this._provincias.set([]);
    this._localidades.set([]);
    this.form.id_localidad = null;

    this.direccionesApi.findProvincias(idPais).subscribe({
      next: (provincias) => this._provincias.set(provincias),
      error: (err) => console.error('Error al cargar provincias:', err)
    });
  }

  onProvinciaChange(idProvincia: number): void {
    this._localidades.set([]);
    this.form.id_localidad = null;

    this.direccionesApi.findLocalidades(idProvincia).subscribe({
      next: (localidades) => this._localidades.set(localidades),
      error: (err) => console.error('Error al cargar localidades:', err)
    });
  }

  get subtitle(): string {
    if (!this.dirEmpresa) return '';
    return `Modificando datos de ${[this.dirEmpresa.direccion, this.dirEmpresa.codigoPostal].join(' ')}`;
  }

  toggleActivo(): void {
    this.form.activo = !this.form.activo;
  }

  submit(): void {
    this.errors = {};
    if (!this.form.direccion)    this.errors['direccion']    = 'Campo obligatorio';
    if (!this.form.codigoPostal) this.errors['codigoPostal'] = 'Campo obligatorio';
    if (!this.form.id_localidad) this.errors['id_localidad'] = 'Campo obligatorio';
    if (!this.selectedProvinciaId) this.errors['provincia'] = 'Campo obligatorio';
    if (!this.selectedPaisId) this.errors['pais'] = 'Campo obligatorio';
  
    if (Object.keys(this.errors).length > 0) return;
    this.save.emit({ id: this.dirEmpresa!.id,  ...this.form, id_localidad: this.form.id_localidad!, id_empresa: this.form.id_empresa!, id_provincia: this.selectedProvinciaId!, id_pais: this.selectedPaisId! });
  };
}
