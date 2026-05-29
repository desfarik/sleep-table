import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SleepStorageService } from '../../services/sleep-storage.service';
import {
  DaySleepData,
  createEmptyDayData,
  createEmptySleepRecord,
} from '../../models/sleep-record';
import {
  formatDuration,
  calculateDaySummary,
} from '../../models/sleep-utils';
import { TimeInputComponent } from '../ui/time-input.component';

const DAY_NAMES = ['День 1', 'День 2', 'День 3', 'День 4', 'День 5', 'День 6', 'День 7'];

@Component({
  selector: 'app-calculator',
  imports: [RouterLink, FormsModule, TimeInputComponent],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
})
export class CalculatorComponent {
  private storage = inject(SleepStorageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly dayNames = DAY_NAMES;
  protected readonly formatDuration = formatDuration;

  record = signal<ReturnType<typeof createEmptySleepRecord> | null>(null);
  recordName = signal<string>('');
  saveStatus = signal<'idle' | 'saving' | 'saved'>('idle');

  isEditMode = computed(() => !!this.record()?.id);

  days = computed(() => {
    const rec = this.record();
    if (!rec) {
      return Array(7).fill(null).map(() => createEmptyDayData()) as DaySleepData[];
    }
    return [...rec.days];
  });

  summaries = computed(() => {
    return this.days().map(day => calculateDaySummary(day));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const record = this.storage.getRecord(id);
      if (record) {
        this.record.set(record);
        this.recordName.set(record.name);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      const newRecord = createEmptySleepRecord();
      this.record.set(newRecord);
      this.recordName.set(newRecord.name);
    }
  }

  protected onNameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.recordName.set(target.value);
    const rec = this.record();
    if (rec) {
      this.storage.updateRecord({ ...rec, name: target.value });
    }
  }

  protected onTimeChange(dayIndex: number, field: keyof DaySleepData, minutes: number | null): void {
    const rec = this.record();
    if (!rec) return;

    const newDays = [...rec.days] as typeof rec.days;
    newDays[dayIndex] = { ...newDays[dayIndex], [field]: minutes };
    
    this.record.set({ ...rec, days: newDays });
    this.storage.updateRecord({ ...rec, days: newDays });
    
    this.showSaveStatus();
  }

  protected getTimeValue(dayIndex: number, field: keyof DaySleepData): number | null {
    const rec = this.record();
    if (!rec) return null;
    return rec.days[dayIndex][field];
  }

  protected get24hWake(summary: ReturnType<typeof calculateDaySummary>): number | null {
    if (summary.total24hSleep === null) return null;
    return 24 * 60 - summary.total24hSleep;
  }

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private showSaveStatus(): void {
    this.saveStatus.set('saving');
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveStatus.set('saved');
      setTimeout(() => this.saveStatus.set('idle'), 2000);
    }, 300);
  }
}
