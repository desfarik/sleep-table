import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SleepStorageService } from '../../services/sleep-storage.service';
import {
  DaySleepData,
  createEmptyDayData,
  createEmptySleepRecord, SleepRecord,
} from '../../models/sleep-record';
import {
  formatDuration,
  calculateDaySummary, calculateAverage, calculateFilledDays,
} from '../../models/sleep-utils';
import { TimeInputComponent } from '../ui/time-input.component';

const DAY_NAMES = ['День 1', 'День 2', 'День 3', 'День 4', 'День 5'];

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

  record = signal<SleepRecord | null>(null);
  recordName = signal<string>('');

  isEditMode = computed(() => !!this.record()?.id);

  days = computed(() => {
    const rec = this.record();
    if (!rec) {
      return Array(5).fill(null).map(() => createEmptyDayData()) as DaySleepData[];
    }
    return rec.days;
  });

  summaries = computed(() => {
    return this.days().map(day => calculateDaySummary(day));
  });

  averageSummaries = computed(() => {
    const summaries = this.summaries();
    const daySleep = calculateAverage(summaries.map(summary => summary.totalDaySleep));
    const nightSleep = calculateAverage(summaries.map(summary => summary.nightSleep));
    if (daySleep === null || nightSleep === null) {
      return {
        daySleep,
        nightSleep,
        total24hSleep: null,
        total24hWB: null,
        wb: null,
      }
    }
    const total24hSleep = daySleep + nightSleep;
    const total24hWB = 24 * 60 - total24hSleep;
    return {
      daySleep,
      nightSleep,
      total24hSleep,
      total24hWB,
      wb: total24hWB / calculateFilledDays(summaries.map(summary => summary.nightSleep)),
    }
  })

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const record = this.storage.getRecord(id);
    if (record) {
      this.record.set(record);
      this.recordName.set(record.name);
    } else {
      const newRecord = this.storage.createRecord();
      this.record.set(newRecord);
      this.recordName.set(newRecord.name);
    }
    effect(() => {
      console.log(this.record());
    });
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
    this.storage.updateRecord(this.record()!);
  }

  protected get24hWake(summary: ReturnType<typeof calculateDaySummary>): number | null {
    if (summary.total24hSleep === null) return null;
    return 24 * 60 - summary.total24hSleep;
  }
}
