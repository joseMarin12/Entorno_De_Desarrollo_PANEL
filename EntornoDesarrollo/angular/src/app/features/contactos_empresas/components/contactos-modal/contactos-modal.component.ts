import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactoEmpresa } from '../../../../models/contacto-empresa.model';

@Component({
  selector: 'app-contactos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contactos-modal.component.html'
})
export class ContactosModalComponent implements OnChanges {
  @Input() contacto: ContactoEmpresa | null = null;
  @Input() idEmpresa!: number;
  @Output() save = new EventEmitter<Omit<ContactoEmpresa, 'id' | 'created_at'>>();
  @Output() close = new EventEmitter<void>();

  form = { nombre: '', primer_apellido: '', cargo: '', email: '', telefono: '', activo: true, id_empresa: 0 };
  errors: Record<string, string> = {};

  get isEdit() { return !!this.contacto; }
  get title() { return this.isEdit ? 'Editar Contacto' : 'Añadir Contacto'; }
  get subtitle() {
    return this.isEdit
      ? `Modificando datos de ${this.contacto!.nombre} ${this.contacto!.primer_apellido}`
      : 'Rellena los datos del nuevo contacto';
  }

  ngOnChanges(): void {
    if (this.contacto) {
      this.form = {
        nombre: this.contacto.nombre,
        primer_apellido: this.contacto.primer_apellido,
        cargo: this.contacto.cargo,
        email: this.contacto.email,
        telefono: this.contacto.telefono,
        activo: this.contacto.activo,
        id_empresa: this.contacto.id_empresa
      };
    } else {
      this.form = { nombre: '', primer_apellido: '', cargo: '', email: '', telefono: '', activo: true, id_empresa: this.idEmpresa };
    }
    this.errors = {};
  }

  submit(): void {
    this.errors = {};
    if (!this.form.nombre) this.errors['nombre'] = 'Campo obligatorio';
    if (!this.form.primer_apellido) this.errors['primer_apellido'] = 'Campo obligatorio';
    if (Object.keys(this.errors).length > 0) return;
    this.save.emit({ ...this.form, id_empresa: this.idEmpresa });
  }
}
