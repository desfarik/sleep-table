/**
 * Time utility functions for sleep calculations.
 */

import { DaySleepData } from './sleep-record';

/**
 * Formats minutes from midnight to HH:MM string.
 * E.g., 420 -> "7:00", 835 -> "13:55"
 */
export function formatTime(minutes: number | null): string {
  if (minutes === null || isNaN(minutes)) {
    return '';
  }
  
  // Handle negative or out-of-range values
  let mins = minutes;
  while (mins < 0) mins += 24 * 60;
  while (mins >= 24 * 60) mins -= 24 * 60;
  
  const hours = Math.floor(mins / 60);
  const minsRemainder = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minsRemainder.toString().padStart(2, '0')}`;
}

/**
 * Parses various time input formats to minutes from midnight.
 * Supports: "7.00", "7,00", "7:00", "7" -> 420 (7:00 AM)
 *           "13.55", "13,55", "13:55" -> 835 (1:55 PM)
 */
export function parseTimeInput(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }
  
  // Remove any colons and replace comma with dot for uniform processing
  let normalized = value.trim().replace(':', '').replace(',', '.');
  
  // Check if it's in HHMM format (3-4 digits without separator)
  const noSeparatorMatch = normalized.match(/^(\d{1,4})$/);
  if (noSeparatorMatch) {
    const input = noSeparatorMatch[1];
    let hours: number, mins: number;
    
    if (input.length <= 2) {
      // Just hours (e.g., "7" or "13")
      hours = parseInt(input, 10);
      mins = 0;
    } else {
      // HHMM format (e.g., "700" -> 7:00, "1355" -> 13:55)
      hours = parseInt(input.slice(0, -2), 10);
      mins = parseInt(input.slice(-2), 10);
    }
    
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
      return hours * 60 + mins;
    }
    return null;
  }
  
  // Check if it's in HH.MM or HH,MM format (with dot or comma)
  const dotMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (dotMatch) {
    const hours = parseInt(dotMatch[1], 10);
    const mins = parseInt(dotMatch[2], 10);
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
      return hours * 60 + mins;
    }
    return null;
  }
  
  return null;
}

/**
 * Formats duration in minutes to HH:MM or H:MM format.
 * E.g., 90 -> "1:30", 40 -> "0:40", 150 -> "2:30"
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || isNaN(minutes)) {
    return '';
  }
  
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculates the difference between two times in minutes.
 * Handles overnight transitions (e.g., 22:00 to 6:00 = 480 minutes).
 */
export function timeDiff(startMinutes: number | null, endMinutes: number | null): number | null {
  if (startMinutes === null || endMinutes === null) {
    return null;
  }
  
  let diff = endMinutes - startMinutes;
  
  // Handle overnight (if end is before start, assume it's next day)
  if (diff < 0) {
    diff += 24 * 60;
  }
  
  return diff;
}

/**
 * Calculates night sleep duration (from bedtime to wake up next day).
 */
export function calculateNightSleep(bedtime: number | null, wakeUp: number | null): number | null {
  if (bedtime === null || wakeUp === null) {
    return null;
  }
  
  // Night sleep goes from bedtime to wake up next morning
  let sleep = wakeUp - bedtime;
  if (sleep < 0) {
    sleep += 24 * 60; // Overnight
  }
  
  return sleep;
}

/**
 * Calculates total day sleep duration from all DS periods.
 */
export function calculateTotalDaySleep(day: DaySleepData): number | null {
  let total = 0;
  let hasData = false;
  
  // DS1
  if (day.ds1Start !== null && day.ds1End !== null) {
    const duration = timeDiff(day.ds1Start, day.ds1End);
    if (duration !== null) {
      total += duration;
      hasData = true;
    }
  }
  
  // DS2
  if (day.ds2Start !== null && day.ds2End !== null) {
    const duration = timeDiff(day.ds2Start, day.ds2End);
    if (duration !== null) {
      total += duration;
      hasData = true;
    }
  }
  
  // DS3
  if (day.ds3Start !== null && day.ds3End !== null) {
    const duration = timeDiff(day.ds3Start, day.ds3End);
    if (duration !== null) {
      total += duration;
      hasData = true;
    }
  }
  
  return hasData ? total : null;
}

/**
 * Calculates wake before sleep (ВБ) durations.
 */
export function calculateWakeBeforeSleep(day: DaySleepData): { wb1: number | null; wb2: number | null; wb3: number | null; wb4: number | null } {
  // ВБ1 = DS1 start - wake up
  const wb1 = timeDiff(day.wakeUp, day.ds1Start);
  
  // ВБ2 = DS2 start - DS1 end (or null if no DS2)
  const wb2 = timeDiff(day.ds1End, day.ds2Start);
  
  // ВБ3 = DS3 start - DS2 end (or bedtime - DS2 end if no DS3)
  let wb3: number | null;
  if (day.ds3Start !== null && day.ds2End !== null) {
    wb3 = timeDiff(day.ds2End, day.ds3Start);
  } else {
    wb3 = null;
  }
  
  // ВБ4 = bedtime - (DS3 end or DS2 end or DS1 end)
  let wb4End: number | null;
  if (day.ds3End !== null) {
    wb4End = day.ds3End;
  } else if (day.ds2End !== null) {
    wb4End = day.ds2End;
  } else if (day.ds1End !== null) {
    wb4End = day.ds1End;
  } else {
    wb4End = null;
  }
  const wb4 = timeDiff(wb4End, day.bedtime);
  
  return { wb1, wb2, wb3, wb4 };
}

/**
 * Calculates all derived values for a day.
 */
export function calculateDaySummary(day: DaySleepData): {
  ds1Duration: number | null;
  ds2Duration: number | null;
  ds3Duration: number | null;
  totalDaySleep: number | null;
  nightSleep: number | null;
  total24hSleep: number | null;
  wakeBeforeSleep: { wb1: number | null; wb2: number | null; wb3: number | null; wb4: number | null };
} {
  const ds1Duration = timeDiff(day.ds1Start, day.ds1End);
  const ds2Duration = timeDiff(day.ds2Start, day.ds2End);
  const ds3Duration = timeDiff(day.ds3Start, day.ds3End);
  const totalDaySleep = calculateTotalDaySleep(day);
  const nightSleep = calculateNightSleep(day.bedtime, day.wakeUp);
  const total24hSleep = totalDaySleep !== null && nightSleep !== null ? totalDaySleep + nightSleep : null;
  const wakeBeforeSleep = calculateWakeBeforeSleep(day);
  
  return {
    ds1Duration,
    ds2Duration,
    ds3Duration,
    totalDaySleep,
    nightSleep,
    total24hSleep,
    wakeBeforeSleep,
  };
}

/**
 * Applies time mask to input value.
 * Formats as HH:MM while typing.
 * Returns the masked value and whether it's a valid complete time.
 */
export function applyTimeMask(value: string): { masked: string; isValid: boolean; minutes: number | null } {
  // Remove any non-digit characters
  const digits = value.replace(/\D/g, '');
  
  if (!digits) {
    return { masked: '', isValid: false, minutes: null };
  }
  
  let hours: number;
  let mins: number;
  
  if (digits.length <= 2) {
    // Still entering hours
    hours = parseInt(digits, 10);
    if (hours > 23) {
      // Invalid hours, clamp to 23
      hours = 23;
    }
    return { masked: hours.toString(), isValid: false, minutes: null };
  } else {
    // Have hours and minutes
    hours = parseInt(digits.slice(0, 2), 10);
    mins = parseInt(digits.slice(2, 4), 10);
    
    // Validate and clamp
    if (hours > 23) hours = 23;
    if (mins > 59) mins = 59;
    
    const masked = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const minutes = hours * 60 + mins;
    
    return { masked, isValid: true, minutes };
  }
}
