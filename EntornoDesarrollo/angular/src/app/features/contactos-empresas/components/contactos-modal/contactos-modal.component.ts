import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { environment } from "../../../../../environments/environment";
import { ContactosEmpresa } from "../../../../models/contactos-empresa.model";

@Component({
    selector: "app-modal-contactos",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./contactos-modal.component.html"
})
export class ContactosModalComponent implements OnInit, OnChanges {
    @Input() idEmpresa!: number;
    @Input() contacto: ContactosEmpresa | null = null;
    @Output() saveAdd = new EventEmitter<Omit<ContactosEmpresa, 'id'>>();
    @Output() saveEdit = new EventEmitter<ContactosEmpresa>();
    @Output() close = new EventEmitter<void>();

    readonly contactosApiUrl = `${environment.apiUrl}/contactos-empresas`;

    private isInitializing = false;

    form = { 
        nombre: '',
        primer_apellido: '', 
        telefono: '', 
        email: '',
        cargo: '',
        id_empresa: null as number | null,
        activo: true 
    };

    errors: Record<string, string> = {};
    private formInitialized = false;

    get isEditMode(): boolean {
        return this.contacto !== null;
    }

    get title(): string {
        return this.isEditMode ? 'Editar Contacto' : 'Añadir Contacto';
    }

    get subtitle(): string {
        if (!this.isEditMode) return 'Rellena los datos del nuevo contacto.';
        return `Modificando datos de ${this.contacto!.nombre} ${this.contacto!.primer_apellido}`;
    }

    get buttonLabel(): string {
        return this.isEditMode ? 'Guardar cambios' : 'Añadir contacto';
    } 

    ngOnInit(): void {
        this.form.id_empresa = this.idEmpresa;
        if (!this.formInitialized) this.fillForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['contacto']) {
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
        if (!this.contacto) return;
        this.isInitializing = true;

        this.form = {
            nombre: this.contacto.nombre,
            primer_apellido: this.contacto.primer_apellido,
            telefono: this.contacto.telefono,
            email: this.contacto.email,
            cargo: this.contacto.cargo,
            id_empresa: this.contacto.id_empresa,
            activo: this.contacto.activo
        };
        
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
        if (!this.form.nombre) this.errors['nombre'] = 'Campo obligatorio';
        if (!this.form.primer_apellido) this.errors['primer_apellido'] = 'Campo obligatorio';
        if (!this.form.telefono) this.errors['telefono'] = 'Campo obligatorio';
        else if (!/^[0-9\+\s\-]{6,15}$/.test(this.form.telefono.trim())) this.errors['telefono'] = 'Introduce un teléfono válido';
        if (!this.form.email) this.errors['email'] = 'Campo obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) this.errors['email'] = 'Email no válido';
        if (!this.form.cargo) this.errors['cargo'] = 'Campo obligatorio';
        if (Object.keys(this.errors).length > 0) return;

        if (this.isEditMode) {
            this.saveEdit.emit({
                id: this.contacto!.id,
                ...this.form, 
                id_empresa: this.form.id_empresa!, 
            });
        } else {
            this.saveAdd.emit({
                ...this.form, 
                id_empresa: this.form.id_empresa!, 
            });
            this.reset();
        }
    }

    reset(): void {
        this.form = {
            nombre: '',
            primer_apellido: '',
            telefono: '',
            email: '',
            cargo: '',
            id_empresa: this.idEmpresa,
            activo: true,
        };
        this.errors = {};
        this.formInitialized = false;
    }
}