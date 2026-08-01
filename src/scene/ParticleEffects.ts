import Phaser from 'phaser';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: number;
  life: number;
  maxLife: number;
}

export class ParticleEffects {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private trailParticles: Particle[];
  private impactParticles: Particle[];
  private maxTrailParticles: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.trailParticles = [];
    this.impactParticles = [];
    this.maxTrailParticles = 20;
  }

  addTrailParticle(x: number, y: number): void {
    if (this.trailParticles.length >= this.maxTrailParticles) {
      this.trailParticles.shift();
    }

    this.trailParticles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      alpha: 1,
      size: 3 + Math.random() * 3,
      color: 0xffffff,
      life: 0,
      maxLife: 500
    });
  }

  createImpactBurst(x: number, y: number): void {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 2 + Math.random() * 4;
      this.impactParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? 0xffaa00 : 0xff6600,
        life: 0,
        maxLife: 800
      });
    }
  }

  createSweetSpotFlash(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 3 + Math.random() * 5;
      this.impactParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 4 + Math.random() * 4,
        color: Math.random() > 0.3 ? 0xffd700 : 0xffff00,
        life: 0,
        maxLife: 1000
      });
    }
  }

  clearTrail(): void {
    this.trailParticles = [];
  }

  update(deltaMs: number): void {
    this.graphics.clear();

    // Update and draw trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life += deltaMs;
      p.alpha = 1 - p.life / p.maxLife;
      p.x += p.vx;
      p.y += p.vy;

      if (p.life >= p.maxLife) {
        this.trailParticles.splice(i, 1);
        continue;
      }

      this.graphics.fillStyle(p.color, p.alpha);
      this.graphics.fillCircle(p.x, p.y, p.size * p.alpha);
    }

    // Update and draw impact particles
    for (let i = this.impactParticles.length - 1; i >= 0; i--) {
      const p = this.impactParticles[i];
      p.life += deltaMs;
      p.alpha = 1 - p.life / p.maxLife;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity on particles

      if (p.life >= p.maxLife) {
        this.impactParticles.splice(i, 1);
        continue;
      }

      this.graphics.fillStyle(p.color, p.alpha);
      this.graphics.fillCircle(p.x, p.y, p.size * p.alpha);
    }
  }
}
