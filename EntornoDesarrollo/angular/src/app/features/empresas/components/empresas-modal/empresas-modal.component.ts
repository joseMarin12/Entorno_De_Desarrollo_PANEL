import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Empresa } from "../../../../models/empresa.model";
import { LookupSelectComponent } from "../../../../shared/lookup-select/lookup-select.component";
import { environment } from "../../../../../environments/environment";

interface FormDireccion { calle: string; ciudad: string; cp: string; }
interface FormContacto { nombre: string; telefono: string; email: string; }

@Component({
    selector: "app-empresas-modal",
    standalone: true,
    imports: [CommonModule, FormsModule, LookupSelectComponent],
    templateUrl: "./empresas-modal.component.html",
})
export class EmpresasModalComponent implements OnInit, OnChanges {
    @Input() empresa: any | null = null; // Usamos any temporalmente hasta ajustar tu interface
    @Input() existingCIFs: string[] = [];
    
    @Output() save = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();

    readonly empresasApiUrl = `${environment.apiUrl}/empresas`;
    readonly asignacionesApiUrl = `${environment.apiUrl}/asignaciones`;

    form = {
        nombre: '',
        razonSocial: '',
        cif: '',
        id_tipo_empresa: null as number | null,
        id_comerciales: null as number | null,
        activo: true,
    };

    // Arrays dinámicos para contactos y direcciones
    direccionesList: FormDireccion[] = [];
    contactosList: FormContacto[] = [];

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
            this.resetLists();
            this.formInitialized = true;
            return;
        }

        this.form = {
            nombre: this.empresa!.nombre,
            razonSocial: this.empresa!.razonSocial,
            cif: this.empresa!.cif,
            id_tipo_empresa: this.empresa!.id_tipo_empresa ?? null,
            id_comerciales: this.empresa!.id_comerciales ?? null,
            activo: this.empresa!.activo,
        };

        // Si la empresa ya trae datos en la BBDD los cargamos, si no, ponemos uno en blanco
        this.direccionesList = this.empresa.direccionesData?.length ? [...this.empresa.direccionesData] : [{ calle: '', ciudad: '', cp: '' }];
        this.contactosList = this.empresa.contactosData?.length ? [...this.empresa.contactosData] : [{ nombre: '', telefono: '', email: '' }];

        this.errors = {};
        this.formInitialized = true;
    }

    // ─── Lógica de Arrays Dinámicos ───
    addDireccion(): void {
        this.direccionesList.push({ calle: '', ciudad: '', cp: '' });
    }

    removeDireccion(index: number): void {
        this.direccionesList.splice(index, 1);
        if (this.direccionesList.length === 0) this.addDireccion(); // Dejar siempre uno mínimo
    }

    addContacto(): void {
        this.contactosList.push({ nombre: '', telefono: '', email: '' });
    }

    removeContacto(index: number): void {
        this.contactosList.splice(index, 1);
        if (this.contactosList.length === 0) this.addContacto(); // Dejar siempre uno mínimo
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

        // Limpiamos los vacíos antes de enviar
        const direccionesValidas = this.direccionesList.filter(d => d.calle || d.ciudad || d.cp);
        const contactosValidos = this.contactosList.filter(c => c.nombre || c.telefono || c.email);

        const payload = {
            ...this.form,
            id_tipo_empresa: this.form.id_tipo_empresa!,
            direccionesData: direccionesValidas,
            contactosData: contactosValidos
        };

        if (this.isEditMode) {
            this.save.emit({ id: this.empresa!.id, ...payload });
        } else {
            this.save.emit(payload);
            this.reset();
        }
    }

    reset(): void {
        this.form = {
            nombre: '',
            razonSocial: '',
            cif: '',
            id_tipo_empresa: null,
            id_comerciales: null,
            activo: true,
        };
        this.resetLists();
        this.errors = {};
    }

    private resetLists(): void {
        this.direccionesList = [{ calle: '', ciudad: '', cp: '' }];
        this.contactosList = [{ nombre: '', telefono: '', email: '' }];
    }
}