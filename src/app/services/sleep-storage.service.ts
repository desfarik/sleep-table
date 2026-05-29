import { Injectable, signal, computed } from '@angular/core';
import { SleepRecord, createEmptySleepRecord } from '../models/sleep-record';

const STORAGE_KEY = 'sleep-records';

@Injectable({
  providedIn: 'root',
})
export class SleepStorageService {
  private recordsSignal = signal<SleepRecord[]>([]);
  
  /** All stored records, sorted by updatedAt descending */
  readonly records = computed(() => {
    return [...this.recordsSignal()].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records = JSON.parse(stored) as SleepRecord[];
        this.recordsSignal.set(records);
      }
    } catch (e) {
      console.error('Failed to load sleep records from localStorage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recordsSignal()));
    } catch (e) {
      console.error('Failed to save sleep records to localStorage:', e);
    }
  }

  /** Creates a new empty record and returns its ID */
  createRecord(name?: string): string {
    const record = createEmptySleepRecord(name);
    this.recordsSignal.update(records => [record, ...records]);
    this.saveToStorage();
    return record.id;
  }

  /** Gets a record by ID */
  getRecord(id: string): SleepRecord | undefined {
    return this.recordsSignal().find(r => r.id === id);
  }

  /** Updates a record and persists to localStorage */
  updateRecord(record: SleepRecord): void {
    record.updatedAt = Date.now();
    this.recordsSignal.update(records =>
      records.map(r => (r.id === record.id ? record : r))
    );
    this.saveToStorage();
  }

  /** Deletes a record by ID */
  deleteRecord(id: string): void {
    this.recordsSignal.update(records => records.filter(r => r.id !== id));
    this.saveToStorage();
  }

  /** Gets the day data for a specific day index (0-6), creating if needed */
  getDayData(record: SleepRecord, dayIndex: number): SleepRecord['days'][0] {
    return record.days[dayIndex];
  }

  /** Updates a specific day's data within a record */
  updateDayData(record: SleepRecord, dayIndex: number, dayData: SleepRecord['days'][0]): void {
    const newDays = [...record.days] as typeof record.days;
    newDays[dayIndex] = dayData;
    this.updateRecord({ ...record, days: newDays });
  }
}
