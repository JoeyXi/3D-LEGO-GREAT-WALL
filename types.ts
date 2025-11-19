import * as THREE from 'three';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum SceneTime {
  DAY = 'day',
  SUNSET = 'sunset',
  NIGHT = 'night',
}

export interface BrickData {
  position: THREE.Vector3;
  color: string;
  type: 'terrain' | 'wall' | 'tower' | 'water' | 'foliage' | 'snow' | 'path';
  name: string;
  description?: string;
  originalColor?: string; // For highlighting
}

export interface InteractionState {
  hoveredId: number | null;
  selectedId: number | null;
}