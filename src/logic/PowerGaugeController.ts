import { GaugeOscillator } from './GaugeOscillator';
import { GAUGE_CONFIG } from '../config';

export interface PowerResult {
  basePower: number;
  effectivePower: number;
  sweetSpotActivated: boolean;
}

export class PowerGaugeController {
  private oscillator: GaugeOscillator;
  private sweetSpotOscillator: GaugeOscillator;
  private basePower: number;
  private isSweetSpotPhase: boolean;

  constructor() {
    this.oscillator = new GaugeOscillator(GAUGE_CONFIG.power);
    this.sweetSpotOscillator = new GaugeOscillator({ min: 0, max: 100, speed: 200 });
    this.basePower = 0;
    this.isSweetSpotPhase = false;
  }

  startPowerGauge(): void {
    this.oscillator.start();
  }

  updatePowerGauge(deltaMs: number): void {
    this.oscillator.update(deltaMs);
  }

  getPowerValue(): number {
    return this.oscillator.getValue();
  }

  stopAndEvaluate(): { power: number; triggersSweetSpot: boolean } {
    this.basePower = this.oscillator.stop();
    const triggersSweetSpot = this.basePower >= 100;
    return { power: this.basePower, triggersSweetSpot };
  }

  startSweetSpotPhase(): void {
    this.isSweetSpotPhase = true;
    this.sweetSpotOscillator.reset();
    this.sweetSpotOscillator.start();
  }

  updateSweetSpot(deltaMs: number): void {
    this.sweetSpotOscillator.update(deltaMs);
  }

  getSweetSpotValue(): number {
    return this.sweetSpotOscillator.getValue();
  }

  evaluateSweetSpotPress(): PowerResult {
    const position = this.sweetSpotOscillator.stop() / 100;
    const { zoneStart, zoneEnd, multiplier } = GAUGE_CONFIG.sweetSpot;
    const inZone = position >= zoneStart && position <= zoneEnd;

    const effectivePower = inZone ? this.basePower * multiplier : this.basePower;

    return {
      basePower: this.basePower,
      effectivePower,
      sweetSpotActivated: inZone
    };
  }

  isInSweetSpotPhase(): boolean {
    return this.isSweetSpotPhase;
  }

  reset(): void {
    this.oscillator.reset();
    this.sweetSpotOscillator.reset();
    this.basePower = 0;
    this.isSweetSpotPhase = false;
  }
}
