import Phaser from 'phaser';

export class Character {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private batAngle: number;
  private breathTween: Phaser.Tweens.Tween | null;
  private breathOffset: number;
  private isSwinging: boolean;
  private swingProgress: number; // 0 = ready stance, 1 = follow through

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.x = 120;
    this.y = 430;
    this.batAngle = -140; // Bat behind the batter (ready stance)
    this.breathOffset = 0;
    this.breathTween = null;
    this.isSwinging = false;
    this.swingProgress = 0;
  }

  create(): void {
    this.draw();
    this.startIdleAnimation();
  }

  private startIdleAnimation(): void {
    this.breathTween = this.scene.tweens.add({
      targets: this,
      breathOffset: { from: 0, to: 3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.isSwinging) {
          this.draw();
        }
      }
    });
  }

  private draw(): void {
    this.graphics.clear();

    const x = this.x;
    const y = this.y - this.breathOffset;

    // --- Legs (slightly apart for batting stance) ---
    this.graphics.fillStyle(0x333333, 1);
    this.graphics.fillRect(x - 12, y + 10, 9, 25);
    this.graphics.fillRect(x + 3, y + 10, 9, 25);

    // --- Body (slightly rotated in stance) ---
    this.graphics.fillStyle(0x2244aa, 1);
    this.graphics.fillRect(x - 14, y - 30, 28, 40);

    // --- Head ---
    this.graphics.fillStyle(0xffcc99, 1);
    this.graphics.fillCircle(x, y - 42, 14);

    // --- Helmet ---
    this.graphics.fillStyle(0x222266, 1);
    this.graphics.fillEllipse(x, y - 48, 30, 16);
    // Helmet brim
    this.graphics.fillRect(x - 16, y - 46, 8, 4);

    // --- Arms holding bat (both hands together) ---
    // The arms go from shoulder toward the bat grip point
    const batRad = (this.batAngle * Math.PI) / 180;
    // Grip position: hands are about 20px from body center
    const gripX = x - 5 + Math.cos(batRad) * 12;
    const gripY = y - 22 + Math.sin(batRad) * 12;

    // Left arm (back arm)
    this.graphics.lineStyle(6, 0xffcc99, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x - 10, y - 20);
    this.graphics.lineTo(gripX, gripY);
    this.graphics.strokePath();

    // Right arm (front arm)
    this.graphics.lineStyle(5, 0xffcc99, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x + 8, y - 18);
    this.graphics.lineTo(gripX, gripY);
    this.graphics.strokePath();

    // --- Bat ---
    const batLength = 55;
    const batStartX = gripX;
    const batStartY = gripY;
    const batEndX = batStartX + Math.cos(batRad) * batLength;
    const batEndY = batStartY + Math.sin(batRad) * batLength;

    // Bat handle (thin)
    this.graphics.lineStyle(4, 0x8B4513, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(batStartX, batStartY);
    const midX = batStartX + Math.cos(batRad) * (batLength * 0.5);
    const midY = batStartY + Math.sin(batRad) * (batLength * 0.5);
    this.graphics.lineTo(midX, midY);
    this.graphics.strokePath();

    // Bat barrel (thick)
    this.graphics.lineStyle(8, 0xA0522D, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(midX, midY);
    this.graphics.lineTo(batEndX, batEndY);
    this.graphics.strokePath();

    // Bat end cap
    this.graphics.fillStyle(0x654321, 1);
    this.graphics.fillCircle(batEndX, batEndY, 5);

    // --- Swing trail effect ---
    if (this.isSwinging && this.swingProgress > 0.2 && this.swingProgress < 0.8) {
      const trailAlpha = 0.3 * (1 - Math.abs(this.swingProgress - 0.5) * 2);
      this.graphics.lineStyle(3, 0xffffff, trailAlpha);
      // Draw a slight arc trail behind current bat position
      const trailAngle1 = this.batAngle - 20;
      const trailAngle2 = this.batAngle - 40;
      const tr1 = (trailAngle1 * Math.PI) / 180;
      const tr2 = (trailAngle2 * Math.PI) / 180;
      this.graphics.beginPath();
      this.graphics.moveTo(batStartX + Math.cos(tr2) * batLength, batStartY + Math.sin(tr2) * batLength);
      this.graphics.lineTo(batStartX + Math.cos(tr1) * batLength, batStartY + Math.sin(tr1) * batLength);
      this.graphics.lineTo(batEndX, batEndY);
      this.graphics.strokePath();
    }
  }

  swing(callback: () => void): void {
    this.isSwinging = true;
    this.swingProgress = 0;
    if (this.breathTween) {
      this.breathTween.pause();
    }

    // Swing from behind (-140°) through contact zone (0°) to follow-through (60°)
    // -140° = bat behind/above batter
    // 0° = horizontal forward (contact point)
    // 60° = follow-through above front shoulder
    this.scene.tweens.add({
      targets: this,
      batAngle: { from: -140, to: 60 },
      swingProgress: { from: 0, to: 1 },
      duration: 280,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.draw();
      },
      onComplete: () => {
        this.scene.time.delayedCall(300, () => {
          // Return to ready stance
          this.scene.tweens.add({
            targets: this,
            batAngle: -140,
            duration: 400,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
              this.draw();
            },
            onComplete: () => {
              this.isSwinging = false;
              this.swingProgress = 0;
              this.draw();
              if (this.breathTween) {
                this.breathTween.resume();
              }
              callback();
            }
          });
        });
      }
    });
  }

  getBatTipPosition(): { x: number; y: number } {
    const batRad = (this.batAngle * Math.PI) / 180;
    const gripX = this.x - 5 + Math.cos(batRad) * 12;
    const gripY = (this.y - this.breathOffset) - 22 + Math.sin(batRad) * 12;
    return {
      x: gripX + Math.cos(batRad) * 55,
      y: gripY + Math.sin(batRad) * 55
    };
  }
}
