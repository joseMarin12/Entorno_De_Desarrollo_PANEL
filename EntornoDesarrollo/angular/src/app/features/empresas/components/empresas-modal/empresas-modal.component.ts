import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Empresa } from "../../../../models/empresa.model";
import { LookupSelectComponent } from "../../../../shared/lookup-select/lookup-select.component";
import { environment } from "../../../../../environments/environment";

@Component({
    selector: "app-modal-empresas",
    standalone: true,
    imports: [CommonModule, FormsModule, LookupSelectComponent],
    templateUrl: "./empresas-modal.component.html",
})
export class EmpresasModalComponent implements OnInit, OnChanges {
    @Input() empresa: Empresa | null = null;
    @Input() existingCIFs: string[] = [];
    @Output() saveAdd = new EventEmitter<Omit<Empresa, 'id'>>();
    @Output() saveEdit = new EventEmitter<Empresa>();
    @Output() close = new EventEmitter<void>();

    readonly empresasApiUrl = `${environment.apiUrl}/empresas`;
    readonly asignacionesApiUrl = `${environment.apiUrl}/asignaciones`;

    form = {
        nombre: '',
        razonSocial: '',
        cif: '',
        id_tipo_empresa: null as number | null,
        direcciones: 0,
        contactos: 0,
        id_comerciales: null as number | null,
        activo: true,
    };

    errors: Record<string, string> = {};
    private formInitialized = false;

    get isEditMode(): boolean {
        return this.empresa !== null;
    }

    get title(): string {
        return this.isEditMode ? 'Editar Empresa' : 'Añadir Empresa';
    }

    get subtitle(): string {
        if (!this.isEditMode) return 'Rellena los datos de la nueva empresa.';
        return `Modificando datos de ${[this.empresa!.nombre, this.empresa!.razonSocial].join(' ')}`;
    }

    get buttonLabel(): string {
        return this.isEditMode ? 'Guardar cambios' : 'Añadir empresa';
    }

    ngOnInit(): void {
        if (!this.formInitialized) this.fillForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['empresa']) {
            this.formInitialized = false;
            this.fillForm();
        }
    }

    private fillForm(): void {
        if (this.formInitialized) return;
        if (!this.isEditMode) {
            this.formInitialized = true;
            return;
        }

        this.form = {
            nombre: this.empresa!.nombre,
            razonSocial: this.empresa!.razonSocial,
            cif: this.empresa!.cif,
            id_tipo_empresa: this.empresa!.id_tipo_empresa ?? null,
            direcciones: this.empresa!.direcciones,
            contactos: this.empresa!.contactos,
            id_comerciales: this.empresa!.id_comerciales ?? null,
            activo: this.empresa!.activo,
        };
        this.errors = {};
        this.formInitialized = true;
    }

    toggleActivo(): void {
        this.form.activo = !this.form.activo;
    }

    submit(): void {
        this.errors = {};
        if (!this.form.nombre) this.errors['nombre'] = 'Campo obligatorio';
        if (!this.form.razonSocial) this.errors['razonSocial'] = 'Campo obligatorio';
        if (!this.form.id_tipo_empresa) this.errors['id_tipo_empresa'] = 'Campo obligatorio';
        if (!this.form.cif) this.errors['cif'] = 'Campo obligatorio';
        else if (!/^[A-Z]\d{8}$/.test(this.form.cif.trim())) {
            this.errors['cif'] = 'Introduce un CIF válido';
        }
        else if (this.existingCIFs.includes(this.form.cif.trim().toUpperCase())) {
            this.errors['cif'] = 'Este CIF ya está registrado';
        }
        if (Object.keys(this.errors).length > 0) return;

        if (this.isEditMode) {
            this.saveEdit.emit({
                id: this.empresa!.id,
                ...this.form,
                id_tipo_empresa: this.form.id_tipo_empresa!,
            });
        } else {
            this.saveAdd.emit({
                ...this.form,
                id_tipo_empresa: this.form.id_tipo_empresa!,
            });
            this.reset();
        }
    }

    reset(): void {
        this.form = {
            nombre: '',
            razonSocial: '',
            cif: '',
            id_tipo_empresa: null,
            direcciones: 0,
            contactos: 0,
            id_comerciales: null,
            activo: true,
        };
        this.errors = {};
    }
}