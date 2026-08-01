import { GameState, GameAction, GameStateData } from '../types';

export class GameFSM {
  private state: GameState;
  private selectedAngle: number | null;
  private selectedPower: number | null;
  private effectivePower: number | null;
  private distance: number | null;

  constructor() {
    this.state = GameState.IDLE;
    this.selectedAngle = null;
    this.selectedPower = null;
    this.effectivePower = null;
    this.distance = null;
  }

  transition(action: GameAction, payload?: Record<string, unknown>): void {
    switch (this.state) {
      case GameState.IDLE:
        if (action === GameAction.START) {
          this.state = GameState.ANGLE_SETTING;
        }
        break;

      case GameState.ANGLE_SETTING:
        if (action === GameAction.PRESS_SPACEBAR) {
          this.selectedAngle = (payload?.angle as number) ?? null;
          this.state = GameState.POWER_SETTING;
        }
        break;

      case GameState.POWER_SETTING:
        if (action === GameAction.PRESS_SPACEBAR) {
          this.selectedPower = (payload?.power as number) ?? null;
          if (this.selectedPower !== null && this.selectedPower >= 100) {
            this.state = GameState.SWEET_SPOT_BONUS;
          } else {
            this.effectivePower = this.selectedPower;
            this.state = GameState.HIT_ANIMATION;
          }
        }
        break;

      case GameState.SWEET_SPOT_BONUS:
        if (action === GameAction.PRESS_SPACEBAR) {
          this.effectivePower = (payload?.effectivePower as number) ?? this.selectedPower;
          this.state = GameState.HIT_ANIMATION;
        }
        break;

      case GameState.HIT_ANIMATION:
        if (action === GameAction.ANIMATION_COMPLETE) {
          this.state = GameState.BALL_FLIGHT;
        }
        break;

      case GameState.BALL_FLIGHT:
        if (action === GameAction.BALL_LANDED) {
          this.distance = (payload?.distance as number) ?? null;
          this.state = GameState.RESULT_DISPLAY;
        }
        break;

      case GameState.RESULT_DISPLAY:
        if (action === GameAction.RESTART) {
          this.reset();
          this.state = GameState.ANGLE_SETTING;
        }
        break;
    }
  }

  getCurrentState(): GameState {
    return this.state;
  }

  getStateData(): GameStateData {
    return {
      currentState: this.state,
      selectedAngle: this.selectedAngle,
      selectedPower: this.selectedPower,
      effectivePower: this.effectivePower,
      distance: this.distance
    };
  }

  reset(): void {
    this.state = GameState.IDLE;
    this.selectedAngle = null;
    this.selectedPower = null;
    this.effectivePower = null;
    this.distance = null;
  }
}
