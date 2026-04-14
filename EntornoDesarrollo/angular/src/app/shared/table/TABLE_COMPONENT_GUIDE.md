+# Table Component Guide (Junior Friendly)

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
- `icon-with-info`: icono + texto principal + subtexto (con formato dinamico)
- `actions`: botones de accion por fila

### Tipos de formato disponibles

Para campos que necesitan formatting (number, date), usa el type alias `FieldType`:

```ts
export type FieldType = "text" | "number" | "date";
```

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

## 6.5) Ejemplo de columna icon-with-info con formato dinamico

La columna `icon-with-info` combina un icono (location, phone, mail, calendar) con texto e subtexto. Cada campo puede tener su propio formato:

```ts
// Ejemplo: Dirección con icono location
const addressColumn: ColumnDef = {
  header: "Dirección",
  type: "icon-with-info",
  iconWithInfoConfig: {
    icon: "location",
    iconColor: "#0066cc",
    mainField: "calle", // Texto plano
    mainFieldType: "text",
    subField: "codigoPostal", // Subtexto
    subFieldType: "text",
  },
};

// Ejemplo: Información de contacto con número y fecha
const contactColumn: ColumnDef = {
  header: "Información",
  type: "icon-with-info",
  iconWithInfoConfig: {
    icon: "phone",
    iconColor: "#22c55e",
    mainField: "telefono", // Número formateado
    mainFieldType: "text",
    subField: "ultimaLlamada", // Fecha formateada
    subFieldType: "date", // Usa Intl.DateTimeFormat
    // Note: El componente usa las opciones de locale/dateOptions de la columna padre
  },
};

// Ejemplo: Finanzas con icono mail y número con moneda
const emailBudgetColumn: ColumnDef = {
  header: "Presupuesto",
  type: "icon-with-info",
  locale: "es-ES",
  iconWithInfoConfig: {
    icon: "mail",
    mainField: "email", // Texto
    mainFieldType: "text",
    subField: "presupuesto", // Número con moneda
    subFieldType: "number", // Usa numberOptions
  },
  numberOptions: { style: "currency", currency: "EUR" },
};
```

### Iconos disponibles para icon-with-info

- `location`: Pin de ubicación
- `phone`: Teléfono
- `mail`: Correo electrónico
- `calendar`: Calendario

Cada icono se renderiza con color configurable via `iconColor` (default: 'currentColor').

## 7) Como usa el componente getFieldValue() internamente

El componente proporciona un método helper `getFieldValue()` que se usa internamente en la columna `icon-with-info`:

```ts
private getFieldValue(
  fieldName: string,
  row: any,
  fieldType: FieldType = 'text',
  col?: ColumnDef
): string {
  const value = row[fieldName];
  if (value === null || value === undefined || value === '') return '';

  if (fieldType === 'number' && col) return this.formatNumber(value, col);
  if (fieldType === 'date' && col) return this.formatDate(value, col);
  return String(value);
}
```

Esto significa que:

- Si `mainFieldType: 'number'`, el valor se formatea con `Intl.NumberFormat`.
- Si `mainFieldType: 'date'`, el valor se formatea con `Intl.DateTimeFormat`.
- Si `mainFieldType: 'text'` (default), se convierte a string directo.

## 8) Consejos para junior devs

- Primero define datos reales (`rows`) y solo despues columnas.
- Mantener `type` de acciones estable (ej: `edit`, `baja`) ayuda al mantenimiento.
- Si un boton no debe desaparecer, no uses `showWhen`; usa `disabledWhen`.
- No pongas logica compleja en el HTML. Mejor en funciones TS.
- Si una tabla nueva se parece a otra, reutiliza la misma estructura y cambia solo `columns`.

## 9) Checklist rapido antes de hacer commit

- La tabla renderiza con datos y sin datos.
- Paginacion cambia de pagina correctamente.
- `actionClick` llega al componente padre.
- Botones deshabilitados no ejecutan accion.
- `number` y `date` se ven en formato esperado por locale.
