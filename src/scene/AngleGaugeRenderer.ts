import Phaser from 'phaser';

export class AngleGaugeRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private visible: boolean;
  private centerX: number;
  private centerY: number;
  private radius: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.centerX = 150;
    this.centerY = 450;
    this.radius = 80;
    this.visible = false;

    this.text = scene.add.text(this.centerX, this.centerY + this.radius + 20, '0°', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.text.setVisible(false);
  }

  show(): void {
    this.visible = true;
    this.text.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.graphics.clear();
    this.text.setVisible(false);
  }

  update(value: number): void {
    if (!this.visible) return;

    this.graphics.clear();

    // Draw arc background
    this.graphics.lineStyle(4, 0x333333, 0.5);
    this.graphics.beginPath();
    this.graphics.arc(this.centerX, this.centerY, this.radius, -Math.PI, -Math.PI / 2, false);
    this.graphics.strokePath();

    // Draw filled arc up to current angle
    const angleRad = (value / 90) * (Math.PI / 2);
    this.graphics.lineStyle(6, 0xff6600, 1);
    this.graphics.beginPath();
    this.graphics.arc(this.centerX, this.centerY, this.radius, -Math.PI, -Math.PI + angleRad, false);
    this.graphics.strokePath();

    // Draw tick marks every 15 degrees
    for (let deg = 0; deg <= 90; deg += 15) {
      const tickAngle = -Math.PI + (deg / 90) * (Math.PI / 2);
      const innerR = this.radius - 10;
      const outerR = this.radius + 5;
      this.graphics.lineStyle(2, 0xffffff, 0.6);
      this.graphics.beginPath();
      this.graphics.moveTo(
        this.centerX + Math.cos(tickAngle) * innerR,
        this.centerY + Math.sin(tickAngle) * innerR
      );
      this.graphics.lineTo(
        this.centerX + Math.cos(tickAngle) * outerR,
        this.centerY + Math.sin(tickAngle) * outerR
      );
      this.graphics.strokePath();
    }

    // Draw needle
    const needleAngle = -Math.PI + angleRad;
    this.graphics.lineStyle(3, 0xff0000, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.centerX, this.centerY);
    this.graphics.lineTo(
      this.centerX + Math.cos(needleAngle) * (this.radius - 5),
      this.centerY + Math.sin(needleAngle) * (this.radius - 5)
    );
    this.graphics.strokePath();

    // Draw center dot
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillCircle(this.centerX, this.centerY, 5);

    // Update text
    this.text.setText(`${Math.round(value)}°`);
  }
}
