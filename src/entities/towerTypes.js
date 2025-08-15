import { Tower } from './tower.js';

export class BasicTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'basic';
    this.range = 2.5;
    this.damage = 50;
    this.fireRate = 1.2;
    this.cost = 50;
    this.projectileSpeed = 300;
    this.color = { base: '#4a5568', barrel: '#2d3748' };
  }

  render(ctx, showRange = false) {
    this._renderTower(ctx, showRange, this.color);
  }
}

export class SniperTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'sniper';
    this.range = 4.5; // longer range
    this.damage = 120; // high damage
    this.fireRate = 0.6; // slower fire rate
    this.cost = 100;
    this.projectileSpeed = 500; // faster projectiles
    this.color = { base: '#065f46', barrel: '#047857' };
  }

  render(ctx, showRange = false) {
    this._renderTower(ctx, showRange, this.color);
    
    // Draw sniper scope
    if (this.target && this.target.active) {
      ctx.save();
      ctx.strokeStyle = 'rgba(5, 150, 105, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

export class CannonTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'cannon';
    this.range = 2.8;
    this.damage = 80;
    this.fireRate = 0.8; // slower but powerful
    this.cost = 80;
    this.projectileSpeed = 250;
    this.splashRadius = 1.2; // area damage
    this.color = { base: '#7c2d12', barrel: '#991b1b' };
  }

  shoot(game) {
    if (this.target && game) {
      const projectile = game.createProjectile(this.centerX, this.centerY, this.target, this.damage, this.projectileSpeed);
      projectile.splashRadius = this.splashRadius;
      projectile.type = 'cannon';
    }
  }

  render(ctx, showRange = false) {
    this._renderTower(ctx, showRange, this.color);
    
    // Draw cannon as larger barrel
    if (this.target && this.target.active) {
      ctx.save();
      const dx = this.target.x - this.centerX;
      const dy = this.target.y - this.centerY;
      const angle = Math.atan2(dy, dx);
      
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(angle);
      
      // Draw larger cannon barrel
      const cannonGradient = ctx.createLinearGradient(0, -4, 0, 4);
      cannonGradient.addColorStop(0, '#dc2626');
      cannonGradient.addColorStop(1, '#7c2d12');
      
      ctx.fillStyle = cannonGradient;
      ctx.fillRect(-3, -4, 25, 8);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -4, 25, 8);
      
      ctx.restore();
    }
  }
}

export class LaserTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'laser';
    this.range = 3.2;
    this.damage = 35;
    this.fireRate = 3; // very fast
    this.cost = 120;
    this.projectileSpeed = 600; // instant-like
    this.color = { base: '#4338ca', barrel: '#3730a3' };
  }

  shoot(game) {
    if (this.target && game) {
      const projectile = game.createProjectile(this.centerX, this.centerY, this.target, this.damage, this.projectileSpeed);
      projectile.type = 'laser';
    }
  }

  render(ctx, showRange = false) {
    this._renderTower(ctx, showRange, this.color);
    
    // Draw laser beam when shooting
    if (this.target && this.target.active && this.lastShot < 0.1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(67, 56, 202, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#4338ca';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}
