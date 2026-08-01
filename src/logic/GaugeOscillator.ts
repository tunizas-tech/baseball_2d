import { GaugeConfig } from '../types';

export class GaugeOscillator {
  private min: number;
  private max: number;
  private speed: number;
  private value: number;
  private direction: number;
  private running: boolean;

  constructor(config: GaugeConfig) {
    this.min = config.min;
    this.max = config.max;
    this.speed = config.speed;
    this.value = config.min;
    this.direction = 1;
    this.running = false;
  }

  start(): void {
    this.running = true;
  }

  update(deltaMs: number): void {
    if (!this.running) return;

    const deltaSeconds = deltaMs / 1000;
    this.value += this.direction * this.speed * deltaSeconds;

    if (this.value >= this.max) {
      this.value = this.max;
      this.direction = -1;
    } else if (this.value <= this.min) {
      this.value = this.min;
      this.direction = 1;
    }

    this.value = Math.max(this.min, Math.min(this.max, this.value));
  }

  stop(): number {
    this.running = false;
    return this.value;
  }

  getValue(): number {
    return this.value;
  }

  isRunning(): boolean {
    return this.running;
  }

  reset(): void {
    this.value = this.min;
    this.direction = 1;
    this.running = false;
  }
}
