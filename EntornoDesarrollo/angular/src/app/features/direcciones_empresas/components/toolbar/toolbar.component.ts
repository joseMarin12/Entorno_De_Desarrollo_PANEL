import { Component, EventEmitter, inject, Output, signal } from "@angular/core";
import { DireccionesEmpresasApiService } from "../../../../services/direcciones-empresas-api.service";
import { Pais } from "../../../../models/pais.model";
import { firstValueFrom } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export type DirFilterType = '' | 'activa' | 'baja';
export type DirFilterPaisType = string;

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
    @Output() searchChange = new EventEmitter<string>();
    @Output() filterChange = new EventEmitter<DirFilterType>();
    @Output() paisFilterChange = new EventEmitter<DirFilterPaisType>();

    private direccionesApi = inject(DireccionesEmpresasApiService);
    private _paises = signal<Pais[]>([]);
    readonly paises = this._paises.asReadonly();

    searchValue = '';
    filterValue: DirFilterType = '';
    paisFilterValue: DirFilterPaisType = '';

    async ngOnInit(): Promise<void> {
        const paises = await firstValueFrom(this.direccionesApi.findPaises());
        this._paises.set(paises);
    }
}