import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DireccionesEmpresasApiService } from "../../../../services/direcciones-empresas-api.service";
import { Pais } from "../../../../models/pais.model";
import { catchError, forkJoin, of } from "rxjs";
import { DireccionEmpresa } from "../../../../models/direccion-empresa.model";
import { Provincia } from "../../../../models/provincia.model";
import { Localidad } from "../../../../models/localidad.model";

@Component({
  selector: 'app-modal-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add.component.html',
})

export class ModalAddComponent implements OnInit {
    @Input() idEmpresa!: number;
    @Output() save = new EventEmitter<Omit<DireccionEmpresa, 'id' | 'localidad' | 'provincia' | 'pais'>>();
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

    toggleActivo(): void {
        this.form.activo = !this.form.activo;
    }

    ngOnInit(): void {
        this.form.id_empresa = this.idEmpresa;
        console.log('idEmpresa:', this.idEmpresa);
        this.direccionesApi.findPaises().subscribe({
            next: (paises) => this._paises.set(paises),
            error: (err) => console.error('Error al cargar países:', err)
        });
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

    submit(): void {
        this.errors = {};
        if (!this.form.direccion) this.errors['direccion'] = 'Campo obligatorio';
        if (!this.form.codigoPostal) this.errors['codigoPostal'] = 'Campo obligatorio';
        if (!this.selectedPaisId) this.errors['pais'] = 'Campo obligatorio';
        if (!this.selectedProvinciaId) this.errors['provincia'] = 'Campo obligatorio';
        if (!this.form.id_localidad) this.errors['id_localidad'] = 'Campo obligatorio';
        if (Object.keys(this.errors).length > 0) return;

        this.save.emit({ ...this.form, id_localidad: this.form.id_localidad!, id_empresa: this.form.id_empresa!, id_provincia: this.selectedProvinciaId!, id_pais: this.selectedPaisId! });
        this.reset();
    }

    reset(): void {
        this.form = { direccion: '', codigoPostal: '', id_localidad: null, id_empresa: this.idEmpresa, activo: true };
        this.selectedPaisId = null;
        this.selectedProvinciaId = null;
        this._provincias.set([]);
        this._localidades.set([]);
        this.errors = {};
    }

}