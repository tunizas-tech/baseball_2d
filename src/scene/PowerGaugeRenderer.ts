import Phaser from 'phaser';
import { GAUGE_CONFIG } from '../config';

export class PowerGaugeRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private visible: boolean;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private showSweetSpot: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.x = 280;
    this.y = 350;
    this.width = 30;
    this.height = 200;
    this.visible = false;
    this.showSweetSpot = false;

    this.text = scene.add.text(this.x + this.width / 2, this.y + this.height + 20, '0%', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.text.setVisible(false);
  }

  show(showSweetSpotIndicator: boolean = false): void {
    this.visible = true;
    this.showSweetSpot = showSweetSpotIndicator;
    this.text.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.showSweetSpot = false;
    this.graphics.clear();
    this.text.setVisible(false);
  }

  update(value: number): void {
    if (!this.visible) return;

    this.graphics.clear();

    // Background
    this.graphics.fillStyle(0x333333, 0.8);
    this.graphics.fillRect(this.x, this.y, this.width, this.height);

    // Border
    this.graphics.lineStyle(2, 0xffffff, 0.8);
    this.graphics.strokeRect(this.x, this.y, this.width, this.height);

    // Sweet spot zone highlight
    if (this.showSweetSpot) {
      const zoneStart = GAUGE_CONFIG.sweetSpot.zoneStart;
      const zoneEnd = GAUGE_CONFIG.sweetSpot.zoneEnd;
      const zoneY = this.y + this.height * (1 - zoneEnd);
      const zoneH = this.height * (zoneEnd - zoneStart);
      this.graphics.fillStyle(0xffd700, 0.4);
      this.graphics.fillRect(this.x, zoneY, this.width, zoneH);

      // Sweet spot label
      this.graphics.lineStyle(2, 0xffd700, 1);
      this.graphics.strokeRect(this.x, zoneY, this.width, zoneH);
    }

    // Fill based on value (0-100)
    const fillPercent = value / 100;
    const fillHeight = this.height * fillPercent;
    const fillY = this.y + this.height - fillHeight;

    // Color gradient: green → yellow → red
    let color: number;
    if (value < 50) {
      color = 0x00cc00;
    } else if (value < 80) {
      color = 0xffcc00;
    } else {
      color = 0xff3300;
    }

    this.graphics.fillStyle(color, 1);
    this.graphics.fillRect(this.x + 2, fillY, this.width - 4, fillHeight);

    // Indicator line at current position
    this.graphics.lineStyle(3, 0xffffff, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.x - 5, fillY);
    this.graphics.lineTo(this.x + this.width + 5, fillY);
    this.graphics.strokePath();

    // Update text
    this.text.setText(`${Math.round(value)}%`);
  }
}
