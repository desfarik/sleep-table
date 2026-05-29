/**
 * Represents a single day's sleep data.
 * Only stores user-input values; all other fields are calculated on the fly.
 */
export interface DaySleepData {
  /** Wake up time in minutes from midnight (e.g., 7:00 = 420) */
  wakeUp: number | null;
  
  /** Day sleep 1: start time in minutes */
  ds1Start: number | null;
  /** Day sleep 1: end time in minutes */
  ds1End: number | null;
  
  /** Day sleep 2: start time in minutes (optional) */
  ds2Start: number | null;
  /** Day sleep 2: end time in minutes (optional) */
  ds2End: number | null;
  
  /** Day sleep 3: start time in minutes (optional) */
  ds3Start: number | null;
  /** Day sleep 3: end time in minutes (optional) */
  ds3End: number | null;
  
  /** Bedtime in minutes from midnight */
  bedtime: number | null;
}

/**
 * Complete sleep record for a week (7 days).
 */
export interface SleepRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  days: [DaySleepData, DaySleepData, DaySleepData, DaySleepData, DaySleepData, DaySleepData, DaySleepData];
}

/**
 * Creates an empty day sleep data object.
 */
export function createEmptyDayData(): DaySleepData {
  return {
    wakeUp: null,
    ds1Start: null,
    ds1End: null,
    ds2Start: null,
    ds2End: null,
    ds3Start: null,
    ds3End: null,
    bedtime: null,
  };
}

/**
 * Creates a new empty sleep record.
 */
export function createEmptySleepRecord(name?: string): SleepRecord {
  return {
    id: crypto.randomUUID(),
    name: name || `Запись ${new Date().toLocaleDateString('ru-RU')}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    days: Array(7).fill(null).map(() => createEmptyDayData()) as [DaySleepData, DaySleepData, DaySleepData, DaySleepData, DaySleepData, DaySleepData, DaySleepData],
  };
}
