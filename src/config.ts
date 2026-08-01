import { GaugeConfig, SweetSpotConfig } from './types';

export const GAME_CONFIG = {
  width: 1024,
  height: 576,
  backgroundColor: 0x87CEEB
};

export const GAUGE_CONFIG: { angle: GaugeConfig; power: GaugeConfig; sweetSpot: SweetSpotConfig } = {
  angle: { min: 0, max: 90, speed: 120 },
  power: { min: 0, max: 100, speed: 150 },
  sweetSpot: { zoneStart: 0.85, zoneEnd: 1.0, multiplier: 1.5 }
};

export const PHYSICS_CONFIG = {
  gravity: 9.8,
  baseDistanceMultiplier: 5,
  maxDistance: 500
};
