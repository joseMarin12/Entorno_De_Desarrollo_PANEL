import { Component, Input, OnInit, OnChanges, SimpleChanges, forwardRef, inject, signal, computed, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { LookupService } from '../../services/lookup.service';

@Component({
  selector: 'app-lookup-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-group">
      @if (label) {
        <label class="form-label">
          {{ label }}
          @if (required) { <span class="req">*</span> }
        </label>
      }
      <div class="select-wrapper" [class.loading]="isLoading()" [class.open]="isOpen()">

        @if (!searchable) {
          <!-- ── Modo select normal ── -->
          <select
            class="form-input"
            [class.error]="hasError"
            [disabled]="disabled || isLoading()"
            [(ngModel)]="internalValue"
            (change)="onSelectChange()">

            @if (isLoading()) {
              <option [value]="null">Cargando opciones...</option>
            } @else {
              <option [value]="null">{{ placeholder }}</option>
              @for (opt of options(); track $index) {
                <option [value]="getValue(opt)">{{ getLabel(opt) }}</option>
              }
            }
          </select>

        } @else {
          <!-- ── Modo buscador ── -->
          <input
            type="text"
            autocomplete="off"
            class="form-input search-input"
            [class.error]="hasError"
            [disabled]="disabled || isLoading()"
            [placeholder]="placeholder"
            [ngModel]="searchText()"
            (ngModelChange)="onSearchInput($event)"
            (focus)="isOpen.set(true)" />

          <div class="select-arrow" (mousedown)="toggleDropdown($event)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          @if (isOpen()) {
            <div class="dropdown-menu">
              <!-- Opción limpiar -->
              <div class="dropdown-item clear-opt" (mousedown)="selectOption(null)">
                <em>— Ninguno —</em>
              </div>
              @if (filteredOptions().length === 0) {
                <div class="dropdown-item empty">Sin resultados</div>
              } @else {
                @for (opt of filteredOptions(); track $index) {
                  <div class="dropdown-item"
                       [class.selected]="getValue(opt) == internalValue"
                       (mousedown)="selectOption(opt)">
                    {{ getLabel(opt) }}
                  </div>
                }
              }
            </div>
          }
        }

        @if (isLoading()) {
          <div class="select-spinner"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .select-wrapper { position: relative; width: 100%; }
    .select-wrapper.loading select,
    .select-wrapper.loading input { color: #999; }

    /* ── Searchable ── */
    .search-input { width: 100%; padding-right: 32px !important; }
    .select-arrow {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      cursor: pointer; color: #9e9e9e; display: flex; align-items: center;
    }
    .select-wrapper.open .select-arrow svg { transform: rotate(180deg); }

    .dropdown-menu {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: #fff; border: 1px solid #e4e6f0; border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.10); z-index: 200;
      max-height: 230px; overflow-y: auto;
    }
    .dropdown-item {
      padding: 10px 14px; cursor: pointer; font-size: 13px;
      color: #1e1b3a; transition: background 0.15s;
    }
    .dropdown-item:hover { background: #f4f6fb; }
    .dropdown-item.selected { background: #e8f4fd; font-weight: 600; color: #476fab; }
    .dropdown-item.empty { color: #9e9e9e; cursor: default; }
    .dropdown-item.empty:hover { background: #fff; }
    .dropdown-item.clear-opt { color: #9e9e9e; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
    .dropdown-item.clear-opt:hover { background: #fdecea; }

    /* ── Spinner ── */
    .select-spinner {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      width: 14px; height: 14px;
      border: 2px solid #ddd; border-top-color: #666;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
    .req { color: #e74c3c; margin-left: 2px; }
    .error { border-color: #e74c3c !important; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LookupSelectComponent),
      multi: true
    }
  ],
  host: {
    '(document:click)': 'onClickOutside($event)',
    '(keydown.escape)': 'closeDropdown()',
    '(focusout)': 'onFocusOut($event)'
  }
})
export class LookupSelectComponent implements OnInit, OnChanges, ControlValueAccessor {
  private lookupSvc = inject(LookupService);
  private elRef = inject(ElementRef);

  @Input() apiUrl = '';
  @Input() action = '';
  @Input() label = '';
  @Input() placeholder = 'Seleccionar...';
  @Input() valueField = 'id';
  @Input() labelField = 'nombre';
  @Input() hasError = false;
  @Input() required = false;
  @Input() searchable = false;

  // ── Estado ────────────────────────────────────────────────────────────────
  options = signal<any[]>([]);
  isLoading = signal(false);
  isOpen = signal(false);
  searchText = signal('');   // ← signal para que computed() reaccione

  internalValue: any = null;
  disabled = false;

  onChange: any = () => { };
  onTouched: any = () => { };

  // Solo filtra cuando searchText cambia (gracias a que es signal)
  filteredOptions = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    const all = this.options();
    if (!q) return all;
    return all.filter(opt => this.getLabel(opt).toLowerCase().includes(q));
  });

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  onClickOutside(event: Event) {
    if (this.searchable && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (this.searchable && !this.elRef.nativeElement.contains(event.relatedTarget as Node)) {
      this.closeDropdown();
    }
  }

  ngOnInit(): void { this.loadData(); }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['apiUrl'] || changes['action']) &&
      !changes['apiUrl']?.isFirstChange() &&
      !changes['action']?.isFirstChange()) {
      this.loadData();
    }
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  private loadData(): void {
    if (!this.apiUrl || !this.action) return;
    this.isLoading.set(true);
    this.lookupSvc.getOptions(this.apiUrl, this.action).subscribe({
      next: data => {
        this.options.set(data || []);
        this.syncSearchText();
        this.isLoading.set(false);
      },
      error: err => {
        console.error(`[LookupSelect] Error en ${this.action}:`, err);
        this.isLoading.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getValue(opt: any): any {
    if (!opt) return null;
    if (typeof opt === 'string') return opt;
    return opt[this.valueField] !== undefined ? opt[this.valueField] : opt[this.labelField];
  }

  getLabel(opt: any): string {
    if (!opt) return '';
    if (typeof opt === 'string') return opt;
    return opt[this.labelField] || opt[this.valueField] || 'Sin nombre';
  }

  syncSearchText(): void {
    if (!this.searchable) return;
    if (this.internalValue != null) {
      const sel = this.options().find(o => this.getValue(o) == this.internalValue);
      this.searchText.set(sel ? this.getLabel(sel) : '');
    } else {
      this.searchText.set('');
    }
  }

  // ── Handlers select normal ────────────────────────────────────────────────
  onSelectChange(): void {
    this.onChange(this.internalValue);
    this.onTouched();
  }

  // ── Handlers modo searchable ──────────────────────────────────────────────
  onSearchInput(text: string): void {
    this.searchText.set(text);
    this.isOpen.set(true);   // mantiene el dropdown abierto mientras escribe
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();  // mousedown: evita que el input pierda focus
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.searchText.set('');  // limpia para facilitar nueva búsqueda
    } else {
      this.syncSearchText();
    }
  }

  closeDropdown(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.syncSearchText();
    this.onTouched();
  }

  selectOption(opt: any): void {
    if (opt === null) {
      this.internalValue = null;
      this.searchText.set('');
    } else {
      this.internalValue = this.getValue(opt);
      this.searchText.set(this.getLabel(opt));
    }
    this.onChange(this.internalValue);
    this.isOpen.set(false);
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────
  writeValue(val: any): void {
    this.internalValue = val;
    this.syncSearchText();
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
