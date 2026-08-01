import Phaser from 'phaser';
import { LeaderboardManager } from '../logic/LeaderboardManager';
import { LeaderboardEntry } from '../types';

export class ResultUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private distanceText: Phaser.GameObjects.Text;
  private leaderboardTexts: Phaser.GameObjects.Text[];
  private restartText: Phaser.GameObjects.Text;
  private titleText: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Graphics;
  private onRestart: (() => void) | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(512, 288);
    this.leaderboardTexts = [];
    this.onRestart = null;

    // Background panel
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRoundedRect(-250, -250, 500, 500, 16);
    this.bg.lineStyle(3, 0xffd700, 1);
    this.bg.strokeRoundedRect(-250, -250, 500, 500, 16);
    this.container.add(this.bg);

    // Title
    this.titleText = scene.add.text(0, -220, '⚾ RESULT ⚾', {
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(this.titleText);

    // Distance display
    this.distanceText = scene.add.text(0, -170, '0 m', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(this.distanceText);

    // Leaderboard title
    const lbTitle = scene.add.text(0, -120, 'TOP 10 LEADERBOARD', {
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(lbTitle);

    // Leaderboard entries
    for (let i = 0; i < 10; i++) {
      const text = scene.add.text(0, -90 + i * 28, '', {
        fontSize: '14px',
        color: '#cccccc',
        align: 'center'
      }).setOrigin(0.5);
      this.leaderboardTexts.push(text);
      this.container.add(text);
    }

    // Restart button
    this.restartText = scene.add.text(0, 210, '[ PRESS SPACE TO RESTART ]', {
      fontSize: '20px',
      color: '#00ff88',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.container.add(this.restartText);

    // Blinking restart text
    scene.tweens.add({
      targets: this.restartText,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.container.setVisible(false);
    this.container.setDepth(100);
  }

  show(distance: number): void {
    this.distanceText.setText(`${distance.toFixed(1)} m`);

    // Update leaderboard
    let entries = LeaderboardManager.load();
    entries = LeaderboardManager.insert(distance, entries);
    this.updateLeaderboard(entries);

    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  private updateLeaderboard(entries: LeaderboardEntry[]): void {
    for (let i = 0; i < 10; i++) {
      if (i < entries.length) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        this.leaderboardTexts[i].setText(`${medal}  ${entries[i].distance.toFixed(1)} m`);
        this.leaderboardTexts[i].setColor(i < 3 ? '#ffd700' : '#cccccc');
      } else {
        this.leaderboardTexts[i].setText('');
      }
    }
  }
}
