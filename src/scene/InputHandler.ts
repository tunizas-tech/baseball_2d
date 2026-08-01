import Phaser from 'phaser';
import { GameState } from '../types';

export class InputHandler {
  private spaceKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  justPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }

  shouldAcceptInput(state: GameState): boolean {
    return (
      state === GameState.ANGLE_SETTING ||
      state === GameState.POWER_SETTING ||
      state === GameState.SWEET_SPOT_BONUS
    );
  }
}
