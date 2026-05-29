import { Component, forwardRef, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import IMask from 'imask';

@Component({
  selector: 'app-time-input',
  template: `
    <input
      type="text"
      inputmode="numeric"
      placeholder="--:--"
      class="time-input"
      #input
    />
  `,
  standalone: true,
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
      padding: 8px 12px;
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
export class TimeInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private mask: any = null;
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private internalValue: number | null = null;
  private isInitialized = false;

  ngOnInit(): void {
    this.mask = IMask(this.el.nativeElement, {
      mask: 'HH:MM',
      blocks: {
        HH: {
          mask: IMask.MaskedRange,
          from: 0,
          to: 23,
          placeholderChar: '-',
        },
        MM: {
          mask: IMask.MaskedRange,
          from: 0,
          to: 59,
          placeholderChar: '-',
        },
      },
    });

    this.mask.on('accept', () => {
      const value = this.mask?.value;
      if (value && value.length === 5 && !value.includes('-')) {
        const [hours, mins] = value.split(':').map(Number);
        const minutes = hours * 60 + mins;
        this.internalValue = minutes;
        this.onChange(minutes);
      } else {
        this.internalValue = null;
        this.onChange(null);
      }
    });

    this.isInitialized = true;
  }

  ngOnDestroy(): void {
    this.mask?.destroy();
  }

  writeValue(value: number | null): void {
    if (!this.isInitialized || !this.mask) return;
    
    this.internalValue = value;
    
    if (value !== null && value !== undefined && value >= 0) {
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      this.mask.value = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    } else {
      this.mask.value = '';
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  constructor(private el: ElementRef<HTMLInputElement>) {}
}
