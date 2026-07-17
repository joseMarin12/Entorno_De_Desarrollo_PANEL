import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Empresa } from "../../../../models/empresa.model";
import { LookupSelectComponent } from "../../../../shared/lookup-select/lookup-select.component";
import { environment } from "../../../../../environments/environment";

interface DireccionFormRow {
    _key: number;
    direccion: string;
    codigoPostal: string;
    id_pais: number | null;
    id_provincia: number | null;
    id_localidad: number | null;
}

interface ContactoFormRow {
    _key: number;
    nombre: string;
    primer_apellido: string;
    telefono: string;
    email: string;
    cargo: string;
}

export interface NuevaDireccionPayload {
    direccion: string;
    codigoPostal: string;
    id_pais: number;
    id_provincia: number;
    id_localidad: number;
}

export interface NuevoContactoPayload {
    nombre: string;
    primer_apellido: string;
    telefono: string;
    email: string;
    cargo: string;
}

export interface GuardarEmpresaPayload<T> {
    empresa: T;
    direcciones: NuevaDireccionPayload[];
    contactos: NuevoContactoPayload[];
}

@Component({
    selector: "app-modal-empresas",
    standalone: true,
    imports: [CommonModule, FormsModule, LookupSelectComponent],
    templateUrl: "./empresas-modal.component.html",
    styles: [`
        .repeat-card {
            position: relative;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 10px;
        }
        .repeat-card .form-grid {
            grid-template-columns: 1fr 1fr;
        }
        .repeat-remove-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: none;
            color: var(--text-muted);
            cursor: pointer;
        }
        .repeat-remove-btn:hover {
            color: #dc2626;
            border-color: #dc2626;
        }
        .btn-add-row {
            width: 100%;
            padding: 10px;
            border: 1px dashed var(--border);
            border-radius: 8px;
            background: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .btn-add-row:hover {
            border-color: #476fab;
            color: #476fab;
        }
    `],
})
export class EmpresasModalComponent implements OnInit, OnChanges {
    @Input() empresa: Empresa | null = null;
    @Input() existingCIFs: string[] = [];
    @Output() saveAdd = new EventEmitter<GuardarEmpresaPayload<Omit<Empresa, 'id'>>>();
    @Output() saveEdit = new EventEmitter<GuardarEmpresaPayload<Empresa>>();
    @Output() close = new EventEmitter<void>();

    /** Filas de direcciones/contactos del formulario. De momento son solo visuales (ver ticket de conexión con la API). */
    direccionesRows: DireccionFormRow[] = [];
    contactosRows: ContactoFormRow[] = [];
    private rowKeyCounter = 0;

    readonly empresasApiUrl = `${environment.apiUrl}/empresas`;
    readonly asignacionesApiUrl = `${environment.apiUrl}/asignaciones`;
    readonly direccionesApiUrl = `${environment.apiUrl}/direcciones-empresas`;

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
        this.direccionesRows = [];
        this.contactosRows = [];
        this.errors = {};
        this.formInitialized = true;
    }

    toggleActivo(): void {
        this.form.activo = !this.form.activo;
    }

    addDireccionRow(): void {
        this.direccionesRows.push({
            _key: ++this.rowKeyCounter,
            direccion: '',
            codigoPostal: '',
            id_pais: null,
            id_provincia: null,
            id_localidad: null,
        });
    }

    removeDireccionRow(key: number): void {
        this.direccionesRows = this.direccionesRows.filter(r => r._key !== key);
    }

    onDireccionPaisChange(row: DireccionFormRow): void {
        row.id_provincia = null;
        row.id_localidad = null;
    }

    onDireccionProvinciaChange(row: DireccionFormRow): void {
        row.id_localidad = null;
    }

    addContactoRow(): void {
        this.contactosRows.push({
            _key: ++this.rowKeyCounter,
            nombre: '',
            primer_apellido: '',
            telefono: '',
            email: '',
            cargo: '',
        });
    }

    removeContactoRow(key: number): void {
        this.contactosRows = this.contactosRows.filter(r => r._key !== key);
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
        const direcciones: NuevaDireccionPayload[] = [];
        for (const row of this.direccionesRows) {
            const vacia = !row.direccion && !row.codigoPostal && !row.id_pais && !row.id_provincia && !row.id_localidad;
            if (vacia) continue;
            if (!row.direccion || !row.codigoPostal || !row.id_pais || !row.id_provincia || !row.id_localidad) {
                this.errors['direccionesRows'] = 'Completa o quita las direcciones incompletas.';
            } else {
                direcciones.push({
                    direccion: row.direccion,
                    codigoPostal: row.codigoPostal,
                    id_pais: row.id_pais,
                    id_provincia: row.id_provincia,
                    id_localidad: row.id_localidad,
                });
            }
        }

        const contactos: NuevoContactoPayload[] = [];
        for (const row of this.contactosRows) {
            const vacio = !row.nombre && !row.primer_apellido && !row.telefono && !row.email && !row.cargo;
            if (vacio) continue;
            if (!row.nombre) {
                this.errors['contactosRows'] = 'Completa o quita los contactos incompletos (falta el nombre).';
            } else {
                contactos.push({ ...row });
            }
        }

        if (Object.keys(this.errors).length > 0) return;

        if (this.isEditMode) {
            this.saveEdit.emit({
                empresa: {
                    id: this.empresa!.id,
                    ...this.form,
                    id_tipo_empresa: this.form.id_tipo_empresa!,
                },
                direcciones,
                contactos,
            });
        } else {
            this.saveAdd.emit({
                empresa: {
                    ...this.form,
                    id_tipo_empresa: this.form.id_tipo_empresa!,
                },
                direcciones,
                contactos,
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
        this.direccionesRows = [];
        this.contactosRows = [];
        this.errors = {};
    }
}