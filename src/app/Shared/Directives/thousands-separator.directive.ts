import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appThousandsSeparator]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ThousandsSeparatorDirective),
      multi: true,
    },
  ],
  host: {
    '(input)': 'handleInput($event)',
    '(blur)': 'handleBlur()',
  },
})
export class ThousandsSeparatorDirective implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.input.value = value ? this.format(String(value)) : '';
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  handleInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    const normalized = this.normalize(element.value);
    element.value = this.format(normalized);
    const numericValue = Number(normalized.replace(/,/g, ''));
    this.onChange(Number.isFinite(numericValue) ? numericValue : 0);
  }

  handleBlur(): void {
    this.onTouched();
  }

  private normalize(value: string): string {
    const westernDigits = value
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/,/g, '')
      .replace(/[^\d.]/g, '');
    const [integer = '', ...decimalParts] = westernDigits.split('.');
    return decimalParts.length ? `${integer}.${decimalParts.join('').slice(0, 2)}` : integer;
  }

  private format(value: string): string {
    if (!value) return '';
    const hasDecimalPoint = value.includes('.');
    const [integer, decimals = ''] = value.split('.');
    const formattedInteger = (integer.replace(/^0+(?=\d)/, '') || '0')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return hasDecimalPoint ? `${formattedInteger}.${decimals}` : formattedInteger;
  }
}
