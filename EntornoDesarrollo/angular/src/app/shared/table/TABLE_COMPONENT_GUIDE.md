# Table Component Guide (Junior Friendly)

Guia rapida para usar `app-table` como tabla reutilizable por configuracion.

## 1) Que resuelve este componente

`app-table` evita duplicar HTML/CSS por cada modulo (usuarios, seleccionadores, comerciales, etc.).

En lugar de crear una tabla nueva por pantalla, solo defines:

- `columns`: estructura y comportamiento de columnas.
- `rows`: datos de la pagina.
- `actions`: botones por fila (ver, editar, baja, activar, etc.).

## 2) Inputs y outputs principales

Inputs:

- `columns`: `ColumnDef[]`
- `rows`: `any[]`
- `currentPage`: numero de pagina actual
- `pageSize`: tamano de pagina
- `totalFiltered`: total de registros tras filtrar
- `entityLabel`: texto de ayuda en paginacion

Outputs:

- `pageChange`: emite pagina seleccionada
- `actionClick`: emite `{ type, id }`

## 3) Tipos de columna soportados

- `avatar-name`: avatar + nombre + sublinea opcional
- `text`: texto plano
- `number`: formato numerico con `Intl.NumberFormat`
- `date`: formato fecha con `Intl.DateTimeFormat`
- `enum-badge`: badge configurable por mapa de valores
- `relation-chip`: chip para relacion (ejemplo: empresa vinculada)
- `status-badge`: badge activo/inactivo
- `actions`: botones de accion por fila

## 4) Control de botones: mostrar vs deshabilitar

Esto es importante:

- `showWhen` controla si el boton se renderiza o no.
- `disabledWhen` controla si el boton aparece deshabilitado.
- `disabledFn(row)` permite una regla personalizada por fila.

Ejemplo mental:

- Quiero que "Editar" siempre se vea, pero este bloqueado si esta inactivo.
  - `showWhen: 'always'`
  - `disabledWhen: 'inactive'`

## 5) Ejemplo minimo (componente pagina)

```ts
import { Component } from "@angular/core";
import { TableComponent, ColumnDef } from "./table.component";

@Component({
  standalone: true,
  selector: "app-demo-page",
  imports: [TableComponent],
  template: ` <app-table [columns]="columns" [rows]="rows" [currentPage]="currentPage" [pageSize]="pageSize" [totalFiltered]="totalFiltered" [entityLabel]="'registros'" (pageChange)="onPageChange($event)" (actionClick)="onAction($event)"> </app-table> `,
})
export class DemoPageComponent {
  currentPage = 1;
  pageSize = 10;
  totalFiltered = 2;

  rows = [
    { id: 1, nombre: "Ana", activo: true, tipo: "interno" },
    { id: 2, nombre: "Luis", activo: false, tipo: "externo" },
  ];

  columns: ColumnDef[] = [
    {
      header: "Nombre",
      type: "avatar-name",
      nameFields: ["nombre"],
      activeField: "activo",
      initialsFn: (row) => (row.nombre || "").slice(0, 2).toUpperCase(),
      colorFn: () => "#476fab",
    },
    {
      header: "Tipo",
      type: "enum-badge",
      field: "tipo",
      enumMap: {
        interno: { label: "Interno", background: "#e8eaf6", color: "#3949ab" },
        externo: { label: "Externo", background: "#fff3e0", color: "#e65100" },
      },
    },
    {
      header: "Estado",
      type: "status-badge",
      activeField: "activo",
      inactiveLabel: "Inactivo",
    },
    {
      header: "Acciones",
      type: "actions",
      actions: [
        { type: "view", title: "Ver", icon: "eye", variant: "view" },
        {
          type: "edit",
          title: "Editar",
          icon: "edit",
          variant: "edit",
          showWhen: "always",
          disabledWhen: "inactive",
          activeField: "activo",
        },
      ],
    },
  ];

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onAction(event: { type: string; id: number }): void {
    if (event.type === "view") {
      console.log("Ver detalle", event.id);
    }
    if (event.type === "edit") {
      console.log("Editar", event.id);
    }
  }
}
```

## 6) Ejemplo de columnas number y date

```ts
const financeColumns: ColumnDef[] = [
  {
    header: "Importe",
    type: "number",
    field: "amount",
    locale: "es-ES",
    numberOptions: { style: "currency", currency: "EUR" },
  },
  {
    header: "Creado",
    type: "date",
    field: "created_at",
    locale: "es-ES",
    dateOptions: { dateStyle: "medium", timeStyle: "short" },
  },
];
```

## 7) Consejos para junior devs

- Primero define datos reales (`rows`) y solo despues columnas.
- Mantener `type` de acciones estable (ej: `edit`, `baja`) ayuda al mantenimiento.
- Si un boton no debe desaparecer, no uses `showWhen`; usa `disabledWhen`.
- No pongas logica compleja en el HTML. Mejor en funciones TS.
- Si una tabla nueva se parece a otra, reutiliza la misma estructura y cambia solo `columns`.

## 8) Checklist rapido antes de hacer commit

- La tabla renderiza con datos y sin datos.
- Paginacion cambia de pagina correctamente.
- `actionClick` llega al componente padre.
- Botones deshabilitados no ejecutan accion.
- `number` y `date` se ven en formato esperado por locale.
