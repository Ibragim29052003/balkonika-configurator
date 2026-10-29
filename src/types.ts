import type { walls, floors } from './materials';
export type Wall = keyof typeof walls;
export type Floor = keyof typeof floors;
export type WindowSide = 'left' | 'back';
export type CurtainColor = 'linen' | 'sage' | 'graphite';
export type Temperature = 'warm' | 'neutral' | 'cool';
export type RugColor = 'sand' | 'clay' | 'olive';
export type Period = 'day' | 'night';
export type CameraView = 'wide' | 'detail' | 'window';
export interface CurtainSettings {
  enabled: boolean;
  open: boolean;
  color: CurtainColor;
  length: number;
}
export interface LightingSettings {
  enabled: boolean;
  on: boolean;
  temperature: Temperature;
  brightness: number;
}
export interface RoomState {
  wall: Wall;
  floor: Floor;
  period: Period;
  curtains: Record<WindowSide, CurtainSettings>;
  lighting: LightingSettings;
  rug: { enabled: boolean; color: RugColor };
}
export interface RoomRenderer {
  update(state: RoomState): void;
  setView(view: CameraView): void;
  dispose(): void;
}
export interface SelectOption<T extends string> {
  value: T;
  label: string;
  color?: string;
}
