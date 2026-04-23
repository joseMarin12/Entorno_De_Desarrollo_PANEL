import { Component, Input, OnInit, OnChanges, SimpleChanges, forwardRef, inject, signal } from '@angular/core';
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
      <div class="select-wrapper" [class.loading]="isLoading()">
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
        
        @if (isLoading()) {
          <div class="select-spinner"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .select-wrapper { position: relative; width: 100%; }
    .select-wrapper.loading select { padding-right: 30px; color: #999; }
    .select-spinner {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      border: 2px solid #ddd;
      border-top-color: #666;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
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
  ]
})
export class LookupSelectComponent implements OnInit, OnChanges, ControlValueAccessor {
  private lookupSvc = inject(LookupService);

  @Input() apiUrl = '';
  @Input() action = '';
  @Input() label = '';
  @Input() placeholder = 'Seleccionar...';
  @Input() valueField = 'id';
  @Input() labelField = 'nombre';
  @Input() hasError = false;
  @Input() required = false;

  options = signal<any[]>([]);
  isLoading = signal(false);
  internalValue: any = null;
  disabled = false;

  onChange: any = () => { };
  onTouched: any = () => { };

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['apiUrl'] || changes['action']) && !changes['apiUrl']?.isFirstChange() && !changes['action']?.isFirstChange()) {
      this.loadData();
    }
  }

  private loadData(): void {
    if (this.apiUrl && this.action) {
      this.isLoading.set(true);
      this.lookupSvc.getOptions(this.apiUrl, this.action).subscribe({
        next: (data) => {
          this.options.set(data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(`[LookupSelect] Error en ${this.action}:`, err);
          this.isLoading.set(false);
        }
      });
    }
  }

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

  onSelectChange(): void {
    this.onChange(this.internalValue);
    this.onTouched();
  }

  writeValue(val: any): void {
    this.internalValue = val;
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
