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
  private fieldGraphics!: Phaser.GameObjects.Graphics;
  private instructionText!: Phaser.GameObjects.Text;
  private sweetSpotText!: Phaser.GameObjects.Text;
  private distanceMeterText!: Phaser.GameObjects.Text;

  private currentDistance: number = 0;
  private ballStartX: number = 170;
  private ballStartY: number = 420;

  // Camera follow
  private cameraFollowing: boolean = false;
  private worldWidth: number = 8000; // Extended world for ball flight

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Set world bounds for camera scrolling
    this.cameras.main.setBounds(0, 0, this.worldWidth, GAME_CONFIG.height);
    this.physics?.world?.setBounds(0, 0, this.worldWidth, GAME_CONFIG.height);

    // Draw extended background
    this.bgGraphics = this.add.graphics();
    this.fieldGraphics = this.add.graphics();
    this.drawBackground();
    this.drawExtendedField();

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

    // UI texts - fixed to camera (using setScrollFactor)
    this.instructionText = this.add.text(GAME_CONFIG.width / 2, 50, 'Press SPACE to start!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.sweetSpotText = this.add.text(GAME_CONFIG.width / 2, 100, '', {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0);
    this.sweetSpotText.setVisible(false);

    // Distance meter - large and centered during flight
    this.distanceMeterText = this.add.text(GAME_CONFIG.width / 2, 80, '', {
      fontSize: '36px',
      color: '#ffdd00',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);
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

    // pixels per meter for world display
    const pixelsPerMeter = 8;

    // Expand world bounds to fit the ball's flight distance + buffer
    const neededWidth = this.ballStartX + this.currentDistance * pixelsPerMeter + GAME_CONFIG.width;
    if (neededWidth > this.worldWidth) {
      this.worldWidth = neededWidth;
    }
    this.cameras.main.setBounds(0, 0, this.worldWidth, GAME_CONFIG.height);

    // Calculate display velocity so ball lands at correct pixel distance
    // distance_pixels = currentDistance * pixelsPerMeter
    // We need: startX + vx * totalTime = startX + distance_pixels
    // So vx = distance_pixels / totalTime
    // And v = vx / cos(angle) ... but let's just use the physics directly
    const v = effectivePower * PHYSICS_CONFIG.baseDistanceMultiplier;

    const path: FlightPath = {
      startX: this.ballStartX,
      startY: this.ballStartY,
      angle,
      initialVelocity: v * pixelsPerMeter,
      gravity: PHYSICS_CONFIG.gravity * pixelsPerMeter,
      totalFlightTime: distResult.flightTime > 0 ? distResult.flightTime : 1
    };

    this.ballFlightAnimator = new BallFlightAnimator(path);
    this.distanceMeterText.setVisible(true);
    this.cameraFollowing = true;
    this.instructionText.setVisible(false);
  }

  private handleBallFlight(delta: number): void {
    if (!this.ballFlightAnimator) return;

    const stillFlying = this.ballFlightAnimator.update(delta);
    const elapsed = this.ballFlightAnimator.getElapsed();
    const totalTime = this.ballFlightAnimator.getTotalFlightTime();

    const pos = this.ballFlightAnimator.getPosition(elapsed);

    // Draw ball at world position
    this.ballGraphics.clear();
    this.ballGraphics.fillStyle(0xffffff, 1);
    this.ballGraphics.fillCircle(pos.x, pos.y, 8);
    this.ballGraphics.lineStyle(2, 0xff0000, 0.8);
    this.ballGraphics.strokeCircle(pos.x, pos.y, 8);

    // Ball shadow on ground
    this.ballGraphics.fillStyle(0x000000, 0.3);
    this.ballGraphics.fillEllipse(pos.x, this.ballStartY + 5, 12, 4);

    // Trail
    this.particleEffects.addTrailParticle(pos.x, pos.y);

    // Camera follows the ball horizontally, keeping it in center-left of screen
    if (this.cameraFollowing) {
      const targetX = pos.x - GAME_CONFIG.width * 0.3;
      const camX = Math.max(0, targetX);
      this.cameras.main.scrollX = camX;
    }

    // Distance meter - show current progress
    const progress = elapsed / totalTime;
    const currentDist = this.currentDistance * progress;
    this.distanceMeterText.setText(`🏏 ${currentDist.toFixed(1)} m`);

    if (!stillFlying) {
      // Ball landed
      this.particleEffects.createImpactBurst(pos.x, pos.y);
      this.distanceMeterText.setText(`🏏 ${this.currentDistance.toFixed(1)} m`);

      this.time.delayedCall(1200, () => {
        this.ballGraphics.clear();
        this.particleEffects.clearTrail();
        this.cameraFollowing = false;

        // Smoothly scroll camera back to start
        this.tweens.add({
          targets: this.cameras.main,
          scrollX: 0,
          duration: 800,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.distanceMeterText.setVisible(false);
            this.fsm.transition(GameAction.BALL_LANDED, { distance: this.currentDistance });
          }
        });
      });
    }
  }

  private handleResultPhase(): void {
    if (this.resultUI) {
      this.resultUI.show(this.currentDistance);
    }

    if (this.inputHandler.justPressed()) {
      this.restartGame();
    }
  }

  private restartGame(): void {
    this.resultUI.hide();
    this.ballGraphics.clear();
    this.distanceMeterText.setVisible(false);
    this.sweetSpotText.setVisible(false);
    this.instructionText.setVisible(true);

    this.angleOscillator.reset();
    this.powerController.reset();
    this.ballFlightAnimator = null;
    this.currentDistance = 0;
    this.cameraFollowing = false;
    this.cameras.main.scrollX = 0;

    this.fsm.transition(GameAction.RESTART);
    this.angleOscillator.start();
    this.angleGauge.show();
    this.instructionText.setText('Set the ANGLE! Press SPACE');
  }

  private drawBackground(): void {
    const g = this.bgGraphics;

    // Sky gradient across full world width
    g.fillStyle(0x87CEEB, 1);
    g.fillRect(0, 0, this.worldWidth, GAME_CONFIG.height);

    // Gradient sky effect
    g.fillStyle(0x6BB3D9, 0.5);
    g.fillRect(0, 0, this.worldWidth, 100);

    // Sun
    g.fillStyle(0xffdd00, 0.8);
    g.fillCircle(300, 60, 35);
    g.fillStyle(0xffee44, 0.4);
    g.fillCircle(300, 60, 45);

    // Clouds scattered across the world
    g.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < this.worldWidth; i += 400) {
      const cx = i + Math.random() * 200;
      const cy = 50 + Math.random() * 60;
      g.fillEllipse(cx, cy, 80 + Math.random() * 40, 25 + Math.random() * 15);
      g.fillEllipse(cx + 30, cy - 5, 60, 20);
    }

    // Ground across full world
    g.fillStyle(0x4a7c3f, 1);
    g.fillRect(0, 440, this.worldWidth, GAME_CONFIG.height - 440);
  }

  private drawExtendedField(): void {
    const g = this.fieldGraphics;

    // Dirt/diamond area at home plate
    g.fillStyle(0xc4883e, 1);
    g.fillTriangle(100, 440, 200, 440, 150, 410);

    // Field lines extending across the world
    g.lineStyle(2, 0xffffff, 0.5);
    g.beginPath();
    g.moveTo(150, 440);
    g.lineTo(this.worldWidth, 380);
    g.strokePath();

    g.beginPath();
    g.moveTo(150, 440);
    g.lineTo(this.worldWidth, 440);
    g.strokePath();

    // Distance markers every 20 meters (1m = 8px)
    const pixelsPerMeter = 8;
    for (let meters = 20; meters <= 200; meters += 20) {
      const px = this.ballStartX + meters * pixelsPerMeter;
      // Marker line
      g.lineStyle(1, 0xffffff, 0.4);
      g.beginPath();
      g.moveTo(px, 425);
      g.lineTo(px, 445);
      g.strokePath();

      // Distance label on ground
      const label = this.add.text(px, 450, `${meters}m`, {
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5, 0);
      label.setAlpha(0.6);
    }

    // Grass texture lines
    g.lineStyle(1, 0x3d6b34, 0.3);
    for (let i = 0; i < this.worldWidth; i += 80) {
      g.beginPath();
      g.moveTo(i, 445);
      g.lineTo(i + 30, 445);
      g.strokePath();
      g.beginPath();
      g.moveTo(i + 15, 460);
      g.lineTo(i + 45, 460);
      g.strokePath();
    }
  }
}
