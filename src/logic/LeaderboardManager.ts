import { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'baseball-hitting-leaderboard';
const MAX_ENTRIES = 10;

export class LeaderboardManager {
  static load(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const entries: LeaderboardEntry[] = JSON.parse(data);
      return LeaderboardManager.sort(entries).slice(0, MAX_ENTRIES);
    } catch {
      return [];
    }
  }

  static save(entries: LeaderboardEntry[]): void {
    try {
      const sorted = LeaderboardManager.sort(entries).slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch {
      // localStorage unavailable - graceful fallback
    }
  }

  static qualifies(distance: number, entries: LeaderboardEntry[]): boolean {
    if (entries.length < MAX_ENTRIES) return true;
    const sorted = LeaderboardManager.sort(entries);
    return distance > sorted[sorted.length - 1].distance;
  }

  static insert(distance: number, entries: LeaderboardEntry[]): LeaderboardEntry[] {
    const newEntry: LeaderboardEntry = {
      distance,
      timestamp: Date.now()
    };
    const updated = [...entries, newEntry];
    const sorted = LeaderboardManager.sort(updated).slice(0, MAX_ENTRIES);
    LeaderboardManager.save(sorted);
    return sorted;
  }

  static sort(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return [...entries].sort((a, b) => b.distance - a.distance);
  }
}
