import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DireccionEmpresa } from "../../../../models/direccion-empresa.model";
import { LookupSelectComponent } from "../../../../shared/lookup-select/lookup-select.component";
import { environment } from "../../../../../environments/environment";

@Component({
    selector: "app-modal-direcciones",
    standalone: true,
    imports: [CommonModule, FormsModule, LookupSelectComponent],
    templateUrl: "./direcciones-modal.component.html"
})
export class DireccionesModalComponent implements OnInit, OnChanges {
    @Input() idEmpresa!: number;
    @Input() direccion: DireccionEmpresa | null = null;
    @Output() saveAdd = new EventEmitter<Omit<DireccionEmpresa, 'id'>>();
    @Output() saveEdit = new EventEmitter<DireccionEmpresa>();
    @Output() close = new EventEmitter<void>();

    readonly direccionesApiUrl = `${environment.apiUrl}/direcciones-empresas`;

    private isInitializing = false;

    private _selectedPaisId: number | null = null;

    get selectedPaisId(): number | null {
        return this._selectedPaisId;
    }

    set selectedPaisId(value: number | null) {
        this._selectedPaisId = value;
        if (!this.isInitializing) {
            this.selectedProvinciaId = null;
            this.form.id_localidad = null;
        }
    }

    private _selectedProvinciaId: number | null = null;

    get selectedProvinciaId(): number | null {
        return this._selectedProvinciaId;
    }

    set selectedProvinciaId(value: number | null) {
        this._selectedProvinciaId = value;
        if (!this.isInitializing) {
            this.form.id_localidad = null;
        }
    }

    form = { 
        direccion: '',
        codigoPostal: '', 
        id_localidad: null as number | null, 
        id_empresa: null as number | null, 
        activo: true 
    };

    errors: Record<string, string> = {};
    private formInitialized = false;

    get isEditMode(): boolean {
        return this.direccion !== null;
    }

    get title(): string {
        return this.isEditMode ? 'Editar Dirección' : 'Añadir Dirección';
    }

    get subtitle(): string {
        if (!this.isEditMode) return 'Rellena los datos de la nueva dirección.';
        return `Modificando datos de ${this.direccion!.direccion}`;
    }

    get buttonLabel(): string {
        return this.isEditMode ? 'Guardar cambios' : 'Añadir dirección';
    } 

    ngOnInit(): void {
        this.form.id_empresa = this.idEmpresa;
        if (!this.formInitialized) this.fillForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['direccion']) {
            this.formInitialized = false;
            this.selectedPaisId = null;
            this.selectedProvinciaId = null;
            this.fillForm();
        }
    }

    private fillForm(): void {
        if (this.formInitialized) return;
        if (!this.isEditMode) {
            this.formInitialized = true;
            return;
        }
        if (!this.direccion) return;
        this.isInitializing = true;

        this.form = {
            direccion: this.direccion.direccion,
            codigoPostal: this.direccion.codigoPostal,
            id_localidad: this.direccion.id_localidad ?? null,
            id_empresa: this.direccion.id_empresa ?? null,
            activo: this.direccion.activo,
        };

        this.selectedPaisId = this.direccion.id_pais;
        this.selectedProvinciaId = this.direccion.id_provincia;
        
        this.errors = {};
        this.formInitialized = true;
        setTimeout(() => this.isInitializing = false);
    }

    toggleActivo(): void {
        this.form.activo = !this.form.activo;
    }

    submit(): void {
        console.log('form completo:', JSON.stringify(this.form));
        console.log('id_empresa', this.form.id_empresa);
        this.errors = {};
        if (!this.form.direccion) this.errors['direccion'] = 'Campo obligatorio';
        if (!this.form.codigoPostal) this.errors['codigoPostal'] = 'Campo obligatorio';
        if (!this.form.id_localidad) this.errors['id_localidad'] = 'Campo obligatorio';
        if (!this.selectedProvinciaId) this.errors['provincia'] = 'Campo obligatorio';
        if (!this.selectedPaisId) this.errors['pais'] = 'Campo obligatorio';
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
            id_empresa: this.idEmpresa,
            activo: true,
        };
        this.selectedPaisId = null;
        this.selectedProvinciaId = null;
        this.errors = {};
        this.formInitialized = false;
    }
}