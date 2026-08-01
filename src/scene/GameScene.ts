import Phaser from 'phaser';
import { GameState, GameAction, FlightPath } from '../types';
import { GameFSM } from '../logic/GameFSM';
import { GaugeOscillator } from '../logic/GaugeOscillator';
import { PowerGaugeController } from '../logic/PowerGaugeController';
import { DistanceCalculator } from '../logic/DistanceCalculator';
import { GAUGE_CONFIG, GAME_CONFIG, PHYSICS_CONFIG } from '../config';
import { InputHandler } from './InputHandler';
import { AngleGaugeRenderer } from './AngleGaugeRenderer';
import { PowerGaugeRenderer } from './PowerGaugeRenderer';
import { Character } from './Character';
import { BallFlightAnimator } from './BallFlightAnimator';
import { ParticleEffects } from './ParticleEffects';
import { ResultUI } from './ResultUI';

export class GameScene extends Phaser.Scene {
  private fsm!: GameFSM;
  private inputHandler!: InputHandler;
  private angleGauge!: AngleGaugeRenderer;
  private powerGauge!: PowerGaugeRenderer;
  private character!: Character;
  private ballFlightAnimator!: BallFlightAnimator | null;
  private particleEffects!: ParticleEffects;
  private resultUI!: ResultUI;

  private angleOscillator!: GaugeOscillator;
  private powerController!: PowerGaugeController;

  private ballGraphics!: Phaser.GameObjects.Graphics;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private instructionText!: Phaser.GameObjects.Text;
  private sweetSpotText!: Phaser.GameObjects.Text;
  private distanceMeterText!: Phaser.GameObjects.Text;

  private currentDistance: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Draw background
    this.bgGraphics = this.add.graphics();
    this.drawBackground();

    // Initialize components
    this.fsm = new GameFSM();
    this.inputHandler = new InputHandler(this);
    this.angleGauge = new AngleGaugeRenderer(this);
    this.powerGauge = new PowerGaugeRenderer(this);
    this.character = new Character(this);
    this.particleEffects = new ParticleEffects(this);
    this.resultUI = new ResultUI(this);

    this.angleOscillator = new GaugeOscillator(GAUGE_CONFIG.angle);
    this.powerController = new PowerGaugeController();

    this.ballGraphics = this.add.graphics();
    this.ballFlightAnimator = null;

    // Instruction text
    this.instructionText = this.add.text(GAME_CONFIG.width / 2, 50, 'Press SPACE to start!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Sweet spot text
    this.sweetSpotText = this.add.text(GAME_CONFIG.width / 2, 100, '', {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.sweetSpotText.setVisible(false);

    // Distance meter during flight
    this.distanceMeterText = this.add.text(GAME_CONFIG.width / 2, 130, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.distanceMeterText.setVisible(false);

    // Create character
    this.character.create();

    // Start game
    this.fsm.transition(GameAction.START);
    this.angleOscillator.start();
    this.angleGauge.show();
    this.instructionText.setText('Set the ANGLE! Press SPACE');
  }

  update(_time: number, delta: number): void {
    const state = this.fsm.getCurrentState();

    switch (state) {
      case GameState.ANGLE_SETTING:
        this.handleAnglePhase(delta);
        break;
      case GameState.POWER_SETTING:
        this.handlePowerPhase(delta);
        break;
      case GameState.SWEET_SPOT_BONUS:
        this.handleSweetSpotPhase(delta);
        break;
      case GameState.HIT_ANIMATION:
        // Handled by swing callback
        break;
      case GameState.BALL_FLIGHT:
        this.handleBallFlight(delta);
        break;
      case GameState.RESULT_DISPLAY:
        this.handleResultPhase();
        break;
    }

    this.particleEffects.update(delta);
  }

  private handleAnglePhase(delta: number): void {
    this.angleOscillator.update(delta);
    this.angleGauge.update(this.angleOscillator.getValue());

    if (this.inputHandler.justPressed()) {
      const angle = this.angleOscillator.stop();
      this.fsm.transition(GameAction.PRESS_SPACEBAR, { angle });
      this.angleGauge.hide();

      // Start power phase
      this.powerController.startPowerGauge();
      this.powerGauge.show(false);
      this.instructionText.setText('Set the POWER! Press SPACE');
    }
  }

  private handlePowerPhase(delta: number): void {
    this.powerController.updatePowerGauge(delta);
    this.powerGauge.update(this.powerController.getPowerValue());

    if (this.inputHandler.justPressed()) {
      const result = this.powerController.stopAndEvaluate();
      this.fsm.transition(GameAction.PRESS_SPACEBAR, { power: result.power });

      if (result.triggersSweetSpot) {
        // Enter sweet spot phase
        this.powerGauge.show(true);
        this.powerController.startSweetSpotPhase();
        this.instructionText.setText('SWEET SPOT! Press SPACE in the GOLD zone!');
        this.sweetSpotText.setText('⚡ BONUS CHANCE! ⚡');
        this.sweetSpotText.setVisible(true);
      } else {
        this.powerGauge.hide();
        this.startHitAnimation();
      }
    }
  }

  private handleSweetSpotPhase(delta: number): void {
    this.powerController.updateSweetSpot(delta);
    this.powerGauge.update(this.powerController.getSweetSpotValue());

    if (this.inputHandler.justPressed()) {
      const result = this.powerController.evaluateSweetSpotPress();
      this.fsm.transition(GameAction.PRESS_SPACEBAR, { effectivePower: result.effectivePower });

      this.powerGauge.hide();
      this.sweetSpotText.setVisible(false);

      if (result.sweetSpotActivated) {
        this.sweetSpotText.setText('⚡ SWEET SPOT! x1.5 POWER! ⚡');
        this.sweetSpotText.setVisible(true);
        this.particleEffects.createSweetSpotFlash(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);
        this.time.delayedCall(1000, () => {
          this.sweetSpotText.setVisible(false);
        });
      }

      this.startHitAnimation();
    }
  }

  private startHitAnimation(): void {
    this.instructionText.setText('');
    this.character.swing(() => {
      this.fsm.transition(GameAction.ANIMATION_COMPLETE);
      this.startBallFlight();
    });
  }

  private startBallFlight(): void {
    const stateData = this.fsm.getStateData();
    const angle = stateData.selectedAngle ?? 45;
    const effectivePower = stateData.effectivePower ?? 50;

    const distResult = DistanceCalculator.calculate({ angle, effectivePower });
    this.currentDistance = distResult.distance;

    const v = effectivePower * PHYSICS_CONFIG.baseDistanceMultiplier;

    // Scale flight for display (compress into screen width)
    const displayScale = (GAME_CONFIG.width - 200) / Math.max(distResult.distance, 1);
    const displayVelocity = v * displayScale * 0.15;

    const path: FlightPath = {
      startX: 170,
      startY: 420,
      angle,
      initialVelocity: displayVelocity,
      gravity: PHYSICS_CONFIG.gravity * displayScale * 0.15,
      totalFlightTime: distResult.flightTime > 0 ? Math.min(distResult.flightTime, 4) : 1
    };

    this.ballFlightAnimator = new BallFlightAnimator(path);
    this.distanceMeterText.setVisible(true);
  }

  private handleBallFlight(delta: number): void {
    if (!this.ballFlightAnimator) return;

    const stillFlying = this.ballFlightAnimator.update(delta);
    const elapsed = this.ballFlightAnimator.getElapsed();
    const totalTime = this.ballFlightAnimator.getTotalFlightTime();

    const pos = this.ballFlightAnimator.getPosition(elapsed);

    // Draw ball
    this.ballGraphics.clear();
    this.ballGraphics.fillStyle(0xffffff, 1);
    this.ballGraphics.fillCircle(pos.x, pos.y, 6);
    this.ballGraphics.lineStyle(1, 0xff0000, 0.8);
    this.ballGraphics.strokeCircle(pos.x, pos.y, 6);

    // Trail
    this.particleEffects.addTrailParticle(pos.x, pos.y);

    // Distance meter progress
    const progress = elapsed / totalTime;
    const currentDist = this.currentDistance * progress;
    this.distanceMeterText.setText(`${currentDist.toFixed(1)} m`);

    if (!stillFlying) {
      // Ball landed
      this.particleEffects.createImpactBurst(pos.x, pos.y);
      this.distanceMeterText.setVisible(false);

      this.time.delayedCall(500, () => {
        this.ballGraphics.clear();
        this.particleEffects.clearTrail();
        this.fsm.transition(GameAction.BALL_LANDED, { distance: this.currentDistance });
      });
    }
  }

  private handleResultPhase(): void {
    if (this.resultUI) {
      this.resultUI.show(this.currentDistance);
    }

    // Check for restart
    if (this.inputHandler.justPressed()) {
      this.restartGame();
    }
  }

  private restartGame(): void {
    this.resultUI.hide();
    this.ballGraphics.clear();
    this.distanceMeterText.setVisible(false);
    this.sweetSpotText.setVisible(false);

    this.angleOscillator.reset();
    this.powerController.reset();
    this.ballFlightAnimator = null;
    this.currentDistance = 0;

    this.fsm.transition(GameAction.RESTART);
    // After restart, FSM goes to ANGLE_SETTING
    this.angleOscillator.start();
    this.angleGauge.show();
    this.instructionText.setText('Set the ANGLE! Press SPACE');
  }

  private drawBackground(): void {
    const g = this.bgGraphics;

    // Sky gradient (already set as background color)

    // Ground
    g.fillStyle(0x4a7c3f, 1);
    g.fillRect(0, 440, GAME_CONFIG.width, GAME_CONFIG.height - 440);

    // Dirt/diamond area
    g.fillStyle(0xc4883e, 1);
    g.fillTriangle(100, 440, 200, 440, 150, 410);

    // Field lines
    g.lineStyle(2, 0xffffff, 0.5);
    g.beginPath();
    g.moveTo(150, 440);
    g.lineTo(GAME_CONFIG.width, 380);
    g.strokePath();

    g.beginPath();
    g.moveTo(150, 440);
    g.lineTo(GAME_CONFIG.width, 440);
    g.strokePath();

    // Distance markers
    g.lineStyle(1, 0xffffff, 0.3);
    for (let i = 1; i <= 5; i++) {
      const x = 150 + i * 160;
      g.beginPath();
      g.moveTo(x, 380);
      g.lineTo(x, 450);
      g.strokePath();
    }

    // Clouds
    g.fillStyle(0xffffff, 0.6);
    g.fillEllipse(200, 80, 80, 30);
    g.fillEllipse(230, 75, 60, 25);
    g.fillEllipse(600, 100, 100, 35);
    g.fillEllipse(640, 90, 70, 28);
    g.fillEllipse(850, 60, 90, 30);

    // Sun
    g.fillStyle(0xffdd00, 0.8);
    g.fillCircle(950, 60, 35);
    g.fillStyle(0xffee44, 0.4);
    g.fillCircle(950, 60, 45);
  }
}
