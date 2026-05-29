import { Component, forwardRef, ElementRef, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MaskitoDirective } from '@maskito/angular';
import { MaskitoOptions } from '@maskito/core';
import { maskitoTimeOptionsGenerator } from '@maskito/kit';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [MaskitoDirective],
  template: `
    <input
      #inputElement
      type="text"
      inputmode="numeric"
      placeholder="--:--"
      class="time-input"
      [maskito]="options"
      (input)="onInput($event)"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeInputComponent),
      multi: true,
    },
  ],
  styles: [`
    :host {
      display: inline-block;
    }

    .time-input {
      width: 70px;
      padding: 4px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
      text-align: center;
      transition: all 0.2s;
      letter-spacing: 1px;
    }

    .time-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  `]
})
export class TimeInputComponent implements ControlValueAccessor{
  @ViewChild('inputElement', { static: true, read: ElementRef }) inputElement!: ElementRef<HTMLInputElement>;

  protected options: MaskitoOptions = maskitoTimeOptionsGenerator({ mode: 'HH:MM' });

  private onChange: (value: number | null) => void = () => {
  };
  private onTouched: () => void = () => {
  };
  private internalValue: number | null = null;

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value && value.length === 5 && !value.includes('_')) {
      const [hours, mins] = value.split(':').map(Number);
      const minutes = hours * 60 + mins;
      this.internalValue = minutes;
      this.onChange(minutes);
    } else {
      this.internalValue = null;
      this.onChange(null);
    }
  }

  writeValue(value: number | null): void {
    if (value === this.internalValue) {
      return;
    }
    this.internalValue = value;

    if (value !== null && value !== undefined && value >= 0) {
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      this.inputElement.nativeElement.value = `${ hours.toString().padStart(2, '0') }:${ mins.toString().padStart(2, '0') }`;
    } else {
      this.inputElement.nativeElement.value = '';
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
