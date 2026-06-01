import { Component, EventEmitter, inject, Output, signal } from "@angular/core";
import { ContactosEmpresasApiService } from "../../../../services/contactos-empresas-api.service";
import { firstValueFrom } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export type ContactoFilterType = '' | 'activa' | 'baja';
export type ContactoFilterCargoType = string;

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
    @Output() searchChange = new EventEmitter<string>();
    @Output() filterChange = new EventEmitter<ContactoFilterType>();
    @Output() cargoFilterChange = new EventEmitter<ContactoFilterCargoType>();

    private contactosApi = inject(ContactosEmpresasApiService);
    private _cargos = signal<string[]>([]);
    readonly cargos = this._cargos.asReadonly();

    searchValue = '';
    filterValue: ContactoFilterType = '';
    cargoFilterValue: ContactoFilterCargoType = '';

    async ngOnInit(): Promise<void> {
        const cargos = await firstValueFrom(this.contactosApi.findCargos());
        this._cargos.set(cargos);
    }
}