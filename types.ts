
export interface Team {
  id: string;
  name: string;
  location: string;
  coordinatorName: string;
  membersCount: number;
}

export type HealthStatus = 'OK' | 'Лечение' | 'Не гуляет';
export type DogComplexity = 'green' | 'yellow' | 'orange' | 'red'; 
// 🟢 (calm), 🟡 (special), 🟠 (difficult), ⚠️ (dangerous)

export interface Dog {
  id: string;
  name: string;
  age: number; // years
  weight: number; // kg
  row?: string; // Aviary/Row
  notes?: string; // Free text
  health: HealthStatus;
  complexity: DogComplexity; // Replaces 'color'
  pairs: string[]; // IDs of friends
  conflicts: string[]; // IDs of enemies
  teamId: string;
  walksToday: number;
  lastWalkTime?: string;
  groupId: string | null;
  isHidden: boolean; // For visibility setting
}

export type GroupStatus = 'forming' | 'active' | 'completed';

export interface WalkGroup {
  id: string;
  teamId: string;
  volunteerName: string; // Display name
  volunteerId?: string; // Link to User
  status: GroupStatus;
  startTime?: string; // Parsed "HH:MM"
  endTime?: string;   // Parsed "HH:MM"
  rawStartTime?: any; // DEBUG: Raw value from DB
  rawEndTime?: any;   // DEBUG: Raw value from DB
  durationMinutes: number;
}

export interface User {
  id: string;
  name: string;
  telegramId?: string;
  telegramUsername?: string;
  role: 'volunteer' | 'coordinator';
  status: 'active' | 'inactive';
  experience?: 'novice' | 'experienced';
  lastLogin?: string;
  teamId?: string;
}

export interface ValidationIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
}

export type ActiveModal = 'none' | 'dogs' | 'volunteers' | 'settings' | 'debug';
