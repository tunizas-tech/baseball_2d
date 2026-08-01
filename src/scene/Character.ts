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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.x = 120;
    this.y = 430;
    this.batAngle = -45;
    this.breathOffset = 0;
    this.breathTween = null;
    this.isSwinging = false;
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

    // Body
    this.graphics.fillStyle(0x2244aa, 1);
    this.graphics.fillRect(x - 12, y - 30, 24, 40);

    // Legs
    this.graphics.fillStyle(0x333333, 1);
    this.graphics.fillRect(x - 10, y + 10, 8, 25);
    this.graphics.fillRect(x + 2, y + 10, 8, 25);

    // Head
    this.graphics.fillStyle(0xffcc99, 1);
    this.graphics.fillCircle(x, y - 42, 14);

    // Helmet
    this.graphics.fillStyle(0x222266, 1);
    this.graphics.fillEllipse(x, y - 48, 30, 16);

    // Arms
    this.graphics.lineStyle(5, 0xffcc99, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x + 10, y - 20);
    this.graphics.lineTo(x + 25, y - 30);
    this.graphics.strokePath();

    // Bat
    const batLength = 50;
    const batRad = (this.batAngle * Math.PI) / 180;
    const batStartX = x + 25;
    const batStartY = y - 30;
    const batEndX = batStartX + Math.cos(batRad) * batLength;
    const batEndY = batStartY + Math.sin(batRad) * batLength;

    this.graphics.lineStyle(6, 0x8B4513, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(batStartX, batStartY);
    this.graphics.lineTo(batEndX, batEndY);
    this.graphics.strokePath();

    // Bat knob
    this.graphics.fillStyle(0x654321, 1);
    this.graphics.fillCircle(batEndX, batEndY, 5);
  }

  swing(callback: () => void): void {
    this.isSwinging = true;
    if (this.breathTween) {
      this.breathTween.pause();
    }

    this.scene.tweens.add({
      targets: this,
      batAngle: { from: -45, to: 90 },
      duration: 300,
      ease: 'Power2',
      onUpdate: () => {
        this.draw();
      },
      onComplete: () => {
        this.scene.time.delayedCall(200, () => {
          this.isSwinging = false;
          this.batAngle = -45;
          this.draw();
          if (this.breathTween) {
            this.breathTween.resume();
          }
          callback();
        });
      }
    });
  }

  getBatTipPosition(): { x: number; y: number } {
    const batRad = (this.batAngle * Math.PI) / 180;
    const batStartX = this.x + 25;
    const batStartY = this.y - 30;
    return {
      x: batStartX + Math.cos(batRad) * 50,
      y: batStartY + Math.sin(batRad) * 50
    };
  }
}
