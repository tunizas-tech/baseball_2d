export enum GameState {
  IDLE = 'IDLE',
  ANGLE_SETTING = 'ANGLE_SETTING',
  POWER_SETTING = 'POWER_SETTING',
  SWEET_SPOT_BONUS = 'SWEET_SPOT_BONUS',
  HIT_ANIMATION = 'HIT_ANIMATION',
  BALL_FLIGHT = 'BALL_FLIGHT',
  RESULT_DISPLAY = 'RESULT_DISPLAY'
}

export enum GameAction {
  START = 'START',
  PRESS_SPACEBAR = 'PRESS_SPACEBAR',
  ANIMATION_COMPLETE = 'ANIMATION_COMPLETE',
  BALL_LANDED = 'BALL_LANDED',
  RESTART = 'RESTART'
}

export interface GameStateData {
  currentState: GameState;
  selectedAngle: number | null;
  selectedPower: number | null;
  effectivePower: number | null;
  distance: number | null;
}

export interface HitParameters {
  angle: number;
  effectivePower: number;
}

export interface DistanceResult {
  distance: number;
  maxHeight: number;
  flightTime: number;
}

export interface FlightPath {
  startX: number;
  startY: number;
  angle: number;
  initialVelocity: number;
  gravity: number;
  totalFlightTime: number;
}

export interface LeaderboardEntry {
  distance: number;
  timestamp: number;
}

export interface GaugeConfig {
  min: number;
  max: number;
  speed: number;
}

export interface SweetSpotConfig {
  zoneStart: number;
  zoneEnd: number;
  multiplier: number;
}

export interface GameSession {
  state: GameState;
  angle: number | null;
  basePower: number | null;
  effectivePower: number | null;
  sweetSpotActivated: boolean;
  distance: number | null;
  flightPath: FlightPath | null;
}
