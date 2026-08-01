import { HitParameters, DistanceResult } from '../types';
import { PHYSICS_CONFIG } from '../config';

export class DistanceCalculator {
  static calculate(params: HitParameters): DistanceResult {
    const angle = Math.max(0, Math.min(90, params.angle));
    const effectivePower = Math.max(0, Math.min(150, params.effectivePower));

    const v = effectivePower * PHYSICS_CONFIG.baseDistanceMultiplier;
    const angleRad = (angle * Math.PI) / 180;
    const g = PHYSICS_CONFIG.gravity;

    const distance = (v * v * Math.sin(2 * angleRad)) / g;
    const maxHeight = (v * v * Math.sin(angleRad) * Math.sin(angleRad)) / (2 * g);
    const flightTime = (2 * v * Math.sin(angleRad)) / g;

    return {
      distance: Math.round(distance * 100) / 100,
      maxHeight: Math.round(maxHeight * 100) / 100,
      flightTime: Math.round(flightTime * 100) / 100
    };
  }
}
