import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Visual style of an action button on hover */
export type ActionVariant = 'view' | 'edit' | 'danger' | 'success' | 'warning';

/** Built-in icon set */
export type ActionIcon = 'eye' | 'edit' | 'alert-circle' | 'ban' | 'check-circle' | 'refresh' | 'trash';

export interface ActionDef {
  /** Arbitrary string emitted in actionClick */
  type: string;
  title: string;
  /** Icon to render inside the button */
  icon: ActionIcon;
  /** Color variant of the button on hover */
  variant: ActionVariant;
  /** When to show this button. Default: 'always' */
  showWhen?: 'always' | 'active' | 'inactive';
  /** Disable rule independent from showWhen. Default: 'never' */
  disabledWhen?: 'never' | 'always' | 'active' | 'inactive';
  /** Row field used to determine active/inactive state */
  activeField?: string;
  /** Optional function for fully custom disabled state per row */
  disabledFn?: (row: any) => boolean;
}

export interface EnumBadgeOption {
  label: string;
  background: string;
  color: string;
}

export interface ColumnDef {
  header: string;
  /**
   * - avatar-name   : avatar circle + main name + optional sub-line
   * - text          : plain text from a field
   * - number        : number formatted with Intl.NumberFormat
   * - date          : date formatted with Intl.DateTimeFormat
   * - enum-badge    : configurable pill badge based on a field value
   * - relation-chip : chip showing a related object's name, or a dash
   * - status-badge  : boolean active/inactive pill badge
   * - actions       : row action buttons
   */
  type: 'avatar-name' | 'text' | 'number' | 'date' | 'enum-badge' | 'relation-chip' | 'status-badge' | 'actions';

  /** Row field to read (used by text, number, date, enum-badge) */
  field?: string;
  /** Row field that holds the boolean active/inactive state */
  activeField?: string;
  /** Optional locale for number/date formatting (default: 'es-ES') */
  locale?: string;

  // number options
  /** Intl.NumberFormat options for type 'number' */
  numberOptions?: Intl.NumberFormatOptions;

  // date options
  /** Intl.DateTimeFormat options for type 'date' */
  dateOptions?: Intl.DateTimeFormatOptions;

  // avatar-name options
  /** Ordered list of row fields that form the display name */
  nameFields?: string[];
  /** Function returning a background color given the row id */
  colorFn?: (id: number) => string;
  /** Function returning the initials string for a row */
  initialsFn?: (row: any) => string;
  /** Optional row field shown as a secondary sub-line below the name */
  subField?: string;
  /** Optional prefix shown before the sub-line value, e.g. 'ID: ' */
  subPrefix?: string;

  // enum-badge options
  /** Maps each field value to its badge appearance (colors set inline) */
  enumMap?: Record<string, EnumBadgeOption>;

  // relation-chip options
  /** If row[skipField] === skipValue the cell shows a dash */
  skipField?: string;
  skipValue?: any;
  /** Row field that contains the related object */
  relationField?: string;
  /** Property of the related object to display (default: 'nombre') */
  relationNameField?: string;
  /** Text shown when the relation is missing (default: '—') */
  emptyLabel?: string;

  // status-badge options
  /** Override the active label (default: 'Activo') */
  activeLabel?: string;
  /** Override the inactive label (default: 'Inactivo') */
  inactiveLabel?: string;

  // actions options
  actions?: ActionDef[];
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {
  columns = input<ColumnDef[]>([]);
  rows = input<any[]>([]);
  currentPage = input(1);
  pageSize = input(10);
  totalFiltered = input(0);
  /** Label appended to the pagination line, e.g. 'seleccionadores' */
  entityLabel = input('registros');

  pageChange = output<number>();
  /** Emits { type, id } when an action button is clicked */
  actionClick = output<{ type: string; id: number }>();

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  paginationInfo = computed(() => {
    if (this.totalFiltered() === 0) return 'Sin resultados';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end   = Math.min(this.currentPage() * this.pageSize(), this.totalFiltered());
    return `Mostrando ${start}–${end} de ${this.totalFiltered()} ${this.entityLabel()}`;
  });

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  isActive(row: any, activeField?: string): boolean {
    return activeField ? !!row[activeField] : true;
  }

  getName(row: any, col: ColumnDef): string {
    return (col.nameFields ?? []).map(f => row[f] ?? '').filter(Boolean).join(' ');
  }

  getInitials(row: any, col: ColumnDef): string {
    return col.initialsFn ? col.initialsFn(row) : '';
  }

  getColor(row: any, col: ColumnDef): string {
    return col.colorFn ? col.colorFn(row['id']) : '#d1d5e8';
  }

  getEnumOption(row: any, col: ColumnDef): EnumBadgeOption | null {
    const key = col.field ? row[col.field] : undefined;
    return (col.enumMap && key !== undefined) ? (col.enumMap[key] ?? null) : null;
  }

  formatNumber(value: any, col: ColumnDef): string {
    if (value === null || value === undefined || value === '') return '';
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return String(value);
    return new Intl.NumberFormat(col.locale ?? 'es-ES', col.numberOptions).format(parsed);
  }

  formatDate(value: any, col: ColumnDef): string {
    if (value === null || value === undefined || value === '') return '';
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat(
      col.locale ?? 'es-ES',
      col.dateOptions ?? { day: '2-digit', month: '2-digit', year: 'numeric' }
    ).format(parsed);
  }

  shouldShowAction(action: ActionDef, row: any): boolean {
    if (!action.showWhen || action.showWhen === 'always') return true;
    const active = this.isActive(row, action.activeField);
    return action.showWhen === 'active' ? active : !active;
  }

  isActionDisabled(action: ActionDef, row: any): boolean {
    if (action.disabledFn) return !!action.disabledFn(row);

    const rule = action.disabledWhen ?? 'never';
    if (rule === 'never') return false;
    if (rule === 'always') return true;

    const active = this.isActive(row, action.activeField);
    return rule === 'active' ? active : !active;
  }

  emitAction(type: string, id: number): void {
    this.actionClick.emit({ type, id });
  }
}

