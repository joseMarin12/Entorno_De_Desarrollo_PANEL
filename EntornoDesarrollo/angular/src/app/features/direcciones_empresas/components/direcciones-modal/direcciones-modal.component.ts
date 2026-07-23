import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DireccionEmpresa } from "../../../../models/direccion-empresa.model";
import { DireccionesEmpresasApiService } from "../../../../services/direcciones-empresas-api.service";
import { Pais } from "../../../../models/pais.model";
import { Provincia } from "../../../../models/provincia.model";
import { Localidad } from "../../../../models/localidad.model";
import { forkJoin } from "rxjs";
// 1. Importamos el selector inteligente reutilizable
import { LookupSelectComponent } from "../../../../shared/lookup-select/lookup-select.component";
import { environment } from "../../../../../environments/environment";

@Component({
    selector: "app-modal-direcciones",
    standalone: true,
    imports: [CommonModule, FormsModule, LookupSelectComponent], // 2. Lo declaramos aquí
    templateUrl: "./direcciones-modal.component.html"
})
export class DireccionesModalComponent implements OnInit, OnChanges {
    @Input() idEmpresa!: number;
    @Input() direccion: DireccionEmpresa | null = null;
    @Output() saveAdd = new EventEmitter<Omit<DireccionEmpresa, 'id'>>();
    @Output() saveEdit = new EventEmitter<DireccionEmpresa>();
    @Output() close = new EventEmitter<void>();

    private direccionesApi = inject(DireccionesEmpresasApiService);
    readonly direccionesApiUrl = `${environment.apiUrl}/api/direcciones-empresas`;

    private _paises = signal<Pais[]>([]);
    private _provincias = signal<Provincia[]>([]);
    private _localidades = signal<Localidad[]>([]);

    readonly paises = this._paises.asReadonly();
    readonly provincias = this._provincias.asReadonly();
    readonly localidades = this._localidades.asReadonly();

    selectedPaisId: number | null = null;
    selectedProvinciaId: number | null = null;

    form = { 
        direccion: '',
        codigoPostal: '', 
        id_localidad: null as number | null, 
        id_empresa: null as number | null, 
        activo: true 
    };

    errors: Record<string, string> = {};
    private formInitialized = false;

    get isEditMode() {
        return this.direccion !== null;
    }

    get title() {
        return this.isEditMode ? 'Editar Dirección' : 'Añadir Dirección';
    }

    get subtitle() {
        if (!this.isEditMode) return 'Rellena los datos de la nueva dirección.';
        return `Modificando datos de ${this.direccion!.direccion}`;
    }

    get buttonLabel() {
        return this.isEditMode ? 'Guardar cambios' : 'Añadir dirección';
    } 

    ngOnInit(): void {
        this.form.id_empresa = this.idEmpresa;
        this.direccionesApi.findPaises().subscribe({
            next: (paises) => {
                this._paises.set(paises);
                if (!this.formInitialized) this.fillForm();
            },
            error: (err) => console.error('Error al cargar países:', err),
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['direccion']) {
            this.formInitialized = false;
            this.fillForm(); 
        }
    }

    onPaisChange(idPais: number): void {
        this.selectedProvinciaId = null;
        this._provincias.set([]);
        this._localidades.set([]);
        this.form.id_localidad = null;

        if (!idPais) return;

        this.direccionesApi.findProvincias(idPais).subscribe({
            next: (provincias) => this._provincias.set(provincias),
            error: (err) => console.error('Error al cargar provincias:', err)
        });
    }

    onProvinciaChange(idProvincia: number): void {
        this._localidades.set([]);
        this.form.id_localidad = null;

        if (!idProvincia) return;

        this.direccionesApi.findLocalidades(idProvincia).subscribe({
            next: (localidades) => this._localidades.set(localidades),
            error: (err) => console.error('Error al cargar localidades:', err)
        });
    }

    private fillForm(): void {
        if (this.formInitialized) return;
        if (!this.isEditMode) {
            this.formInitialized = true;
            return;
        }
        if (!this.direccion || this._paises().length === 0) return;

        this.selectedPaisId = this.direccion.id_pais;
        this.selectedProvinciaId = this.direccion.id_provincia;

        this.form = {
            direccion: this.direccion!.direccion,
            codigoPostal: this.direccion!.codigoPostal,
            id_localidad: this.direccion!.id_localidad ?? null,
            id_empresa: this.direccion!.id_empresa ?? null,
            activo: this.direccion!.activo,
        };
        this.errors = {};
        this.formInitialized = true;

        forkJoin({
            provincias: this.direccionesApi.findProvincias(this.direccion.id_pais),
            localidades: this.direccionesApi.findLocalidades(this.direccion.id_provincia),
        }).subscribe({
            next: ({ provincias, localidades }) => {
                this._provincias.set(provincias);
                this._localidades.set(localidades);
            },
            error: (err) => console.error('Error al cargar provincias/localidades:', err),
        });
    }

    toggleActivo(): void {
        this.form.activo = !this.form.activo;
    }

    submit(): void {
        this.errors = {};
        if (!this.form.direccion) this.errors['direccion'] = 'Campo obligatorio';
        if (!this.form.codigoPostal) this.errors['codigoPostal'] = 'Campo obligatorio';
        if (!this.form.id_localidad) this.errors['id_localidad'] = 'Campo obligatorio';
        if (!this.selectedProvinciaId) this.errors['id_provincia'] = 'Campo obligatorio';
        if (!this.selectedPaisId) this.errors['id_pais'] = 'Campo obligatorio';
        if (Object.keys(this.errors).length > 0) return;

        if (this.isEditMode) {
            this.saveEdit.emit({
                id: this.direccion!.id,
                ...this.form, 
                id_localidad: this.form.id_localidad!, 
                id_empresa: this.form.id_empresa!, 
                id_provincia: this.selectedProvinciaId!, 
                id_pais: this.selectedPaisId! 
            });
        } else {
            this.saveAdd.emit({
                ...this.form, 
                id_localidad: this.form.id_localidad!, 
                id_empresa: this.form.id_empresa!, 
                id_provincia: this.selectedProvinciaId!, 
                id_pais: this.selectedPaisId!
            });
            this.reset();
        }
    }

    reset(): void {
        this.form = {
            direccion: '',
            codigoPostal: '',
            id_localidad: null,
            id_empresa: null,
            activo: true,
        };
        this.errors = {};
    }
}