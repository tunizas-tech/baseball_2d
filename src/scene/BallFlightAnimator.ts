import { FlightPath } from '../types';

export class BallFlightAnimator {
  private path: FlightPath;
  private elapsed: number;
  private landed: boolean;

  constructor(path: FlightPath) {
    this.path = path;
    this.elapsed = 0;
    this.landed = false;
  }

  getPosition(t: number): { x: number; y: number } {
    const { startX, startY, angle, initialVelocity, gravity } = this.path;
    const angleRad = (angle * Math.PI) / 180;

    const vx = initialVelocity * Math.cos(angleRad);
    const vy = initialVelocity * Math.sin(angleRad);

    const x = startX + vx * t;
    const y = startY - (vy * t - 0.5 * gravity * t * t);

    return { x, y };
  }

  update(deltaMs: number): boolean {
    if (this.landed) return false;

    this.elapsed += deltaMs / 1000;

    if (this.elapsed >= this.path.totalFlightTime) {
      this.elapsed = this.path.totalFlightTime;
      this.landed = true;
      return false;
    }

    return true;
  }

  hasLanded(): boolean {
    return this.landed;
  }

  getElapsed(): number {
    return this.elapsed;
  }

  getTotalFlightTime(): number {
    return this.path.totalFlightTime;
  }
}
